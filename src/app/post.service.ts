import { Injectable, Inject } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/throw";

import { BackendUri } from './settings';
import { Post } from './post';
import { Category } from './category';

@Injectable()
export class PostService {

  constructor(
    private _http: Http,
    @Inject(BackendUri) private _backendUri) { }

  private handleError(error: Response | any): Observable<any> {
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

  getPosts(): Observable<Post[]> {

    /*----------------------------------------------------------------------------------------------|
     | ~~~ Pink Path ~~~                                                                            |
     |----------------------------------------------------------------------------------------------|
     | Pide al servidor que te retorne los posts ordenados de más reciente a menos, teniendo en     |
     | cuenta su fecha de publicación. Filtra también aquellos que aún no están publicados, pues no |
     | deberían mostrarse al usuario.                                                               |
     |                                                                                              |
     | En la documentación de 'JSON Server' tienes detallado cómo hacer el filtrado y ordenación de |
     | los datos en tus peticiones, pero te ayudo igualmente. La querystring debe tener estos       |
     | parámetros:                                                                                  |
     |                                                                                              |
     |   - Filtro por fecha de publicación: publicationDate_lte=x (siendo x la fecha actual)        |
     |   - Ordenación: _sort=publicationDate&_order=DESC                                            |
     |----------------------------------------------------------------------------------------------*/
    
    const publicationDateFilter: string = `publicationDate_lte=${new Date().getTime()}`;
    const orderByPublicationDate: string = '_sort=publicationDate&_order=DESC';
    
    return this._http
      .get(`${this._backendUri}/posts?${publicationDateFilter}&${orderByPublicationDate}`)
      .map((response: Response): Post[] => Post.fromJsonToList(response.json()))
      .catch(this.handleError);
  }

  getPostsBySearch(search: string): Observable<Post[]> {

    const searchFilter: string = `q=${search}`;
    const publicationDateFilter: string = `publicationDate_lte=${new Date().getTime()}`;
    const orderByPublicationDate: string = '_sort=publicationDate&_order=DESC';
    
    return this._http
      .get(`${this._backendUri}/posts?${searchFilter}&${publicationDateFilter}&${orderByPublicationDate}`)
      .map((response: Response): Post[] => Post.fromJsonToList(response.json()))
      .catch(this.handleError);
  }

  getUserPosts(id: number): Observable<Post[]> {

    /*----------------------------------------------------------------------------------------------|
     | ~~~ Red Path ~~~                                                                             |
     |----------------------------------------------------------------------------------------------|
     | Ahora mismo, esta función está obteniendo todos los posts existentes, y solo debería obtener |
     | aquellos correspondientes al autor indicado. Añade los parámetros de búsqueda oportunos para |
     | que retorne solo los posts que buscamos. Ten en cuenta que, además, deben estar ordenados    |
     | por fecha de publicación descendente y obtener solo aquellos que estén publicados.           |
     |                                                                                              |
     | En la documentación de 'JSON Server' tienes detallado cómo hacer el filtrado y ordenación de |
     | los datos en tus peticiones, pero te ayudo igualmente. La querystring debe tener estos       |
     | parámetros:                                                                                  |
     |                                                                                              |
     |   - Filtro por autor: author.id=x (siendo x el identificador del autor)                      |
     |   - Filtro por fecha de publicación: publicationDate_lte=x (siendo x la fecha actual)        |
     |   - Ordenación: _sort=publicationDate&_order=DESC                                            |
     |----------------------------------------------------------------------------------------------*/

    const authorFilter: string = `author.id=${id}`;
    const publicationDateFilter: string = `publicationDate_lte=${new Date().getTime()}`;
    const orderByPublicationDate: string = '_sort=publicationDate&_order=DESC';
    
    return this._http
      .get(`${this._backendUri}/posts?${authorFilter}&${publicationDateFilter}&${orderByPublicationDate}`)
      .map((response: Response): Post[] => Post.fromJsonToList(response.json()))
      .catch(this.handleError);
  }

  getCategoryPosts(id: number): Observable<Post[]> {

    /*--------------------------------------------------------------------------------------------------|
     | ~~~ Yellow Path ~~~                                                                              |
     |--------------------------------------------------------------------------------------------------|
     | Ahora mismo, esta función está obteniendo todos los posts existentes, y solo debería obtener     |
     | aquellos correspondientes a la categoría indicada. Añade los parámetros de búsqueda oportunos    |
     | para que retorne solo los posts que buscamos. Ten en cuenta que, además, deben estar ordenados   |
     | por fecha de publicación descendente y obtener solo aquellos que estén publicados.               |
     |                                                                                                  |
     | Este Path tiene un extra de dificultad: un objeto Post tiene una colección de objetos Categoria, |
     | y 'JSON Server' no permite filtrado en colecciones anidadas. Por tanto, te toca a ti darle una   |
     | solución a este marrón. Una posibilidad sería aprovechar el operador 'map' de los observables.   |
     | Sirven para transformar flujos de datos y, de alguna forma, es lo que vamos buscando. Podríamos  |
     | obtener todos los posts y luego filtrarlos por categoría en 'map'. Ahí te lo dejo.               |
     |                                                                                                  |
     | En la documentación de 'JSON Server' tienes detallado cómo hacer el filtrado y ordenación de los |
     | datos en tus peticiones, pero te ayudo igualmente. La querystring debe tener estos parámetros:   |
     |                                                                                                  |
     |   - Filtro por fecha de publicación: publicationDate_lte=x (siendo x la fecha actual)            |
     |   - Ordenación: _sort=publicationDate&_order=DESC                                                |
     |--------------------------------------------------------------------------------------------------*/

    const publicationDateFilter: string = `publicationDate_lte=${new Date().getTime()}`;
    const orderByPublicationDate: string = '_sort=publicationDate&_order=DESC';
    
    return this._http
      .get(`${this._backendUri}/posts?${publicationDateFilter}&${orderByPublicationDate}`)
      .map((response: Response): Post[] => Post.fromJsonToList(response.json())
        .filter((post: Post): boolean => post.categories
          .findIndex((category: Category): boolean => (
            category.id.toString() === id.toString()
          )) >= 0
        )
      )
      .catch(this.handleError);
  }

  getPostDetails(id: number): Observable<Post> {
    return this._http
      .get(`${this._backendUri}/posts/${id}`)
      .map((response: Response): Post => {
        const post = Post.fromJson(response.json());
        return post.publicationDate > new Date().getTime()
          ? null 
          : post;
      })
      .catch(this.handleError);
  }

  createPost(post: Post): Observable<Post> {

    /*----------------------------------------------------------------------------------|
     | ~~~ Purple Path ~~~                                                              |
     |----------------------------------------------------------------------------------|
     | Utiliza el cliente HTTP para guardar en servidor el post indicado. La ruta sobre |
     | la cual tienes que hacer la petición POST es '/posts'. Recuerda que siempre que  |
     | se crea una entidad en servidor es una buena práctica retornar la misma con los  |
     | datos actualizados obtenidos tras la inserción; puedes usar la función estática  |
     | 'fromJson() para crar un nuevo objeto Post basado en la respuesta HTTP obtenida. |
     |----------------------------------------------------------------------------------*/

    return this._http
      .post(`${this._backendUri}/posts`, post)
      .map((response: Response): Post => Post.fromJson(response.json()))
      .catch(this.handleError);
  }

  editPost(post: Post): Observable<Post> {
    return this._http
      .put(`${this._backendUri}/posts/${post.id}`, post)
      .map((response: Response): Post => Post.fromJson(response.json()))
      .catch(this.handleError);
  }

  patchPostLikes(id: number, likes: number[]): Observable<Post> {
    return this._http
      .patch(`${this._backendUri}/posts/${id}`, { likes })
      .map((response: Response): Post => Post.fromJson(response.json()))
      .catch(this.handleError);

  }

}
