import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { NativeWindow } from './../window';
import { Post } from './../post';
import { PostsResolveService } from './../posts-resolve.service';

@Component({
  templateUrl: './posts-view.component.html',
  styleUrls: ['./posts-view.component.css']
})
export class PostsViewComponent implements OnInit {

  posts: Post[];
  search: string;

  constructor(
    private _postResolveService: PostsResolveService,
    private _activatedRoute: ActivatedRoute,
    @Inject(NativeWindow) private _window) { }

  ngOnInit(): void {
    this._activatedRoute.queryParams.subscribe((params: Params) => {
      this.search = params.q || '';
      this._postResolveService.resolve(this._activatedRoute.snapshot)
        .subscribe(
          (posts: Post[]) => this.posts = posts,
          (error: any) => this.posts = []
        );
    });
    this._window.scrollTo(0, 0);
  }

}
