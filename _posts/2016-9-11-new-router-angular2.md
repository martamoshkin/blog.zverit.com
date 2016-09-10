---
layout: post
title:  "Переносим Angular 2 на новый Router 3.0"
date:   2016-09-11 01:53:10 +0300
category: Frontend
tags: [Angular2, TypeScript, Router]
---

Во время альфа и бета версий Angular2 router-deprecated вполне справлялся со своими задачами. С появлением RC1 вышел и переработанный 
router 2.0, затем в вериси RC2 снова выходит новая версия роутера — 3.0. Полная его переработка была связана с тем, что возникли серьезные
проблемы, такие как глубокая линковка в lazy-loaded секциях. 
Итак, рассмотрим основные изменения.
<!-- more -->

<h2>Импортирование</h2>
Раньше было так:

```ts
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprected';
```

Теперь так:

```ts
import { Routes, RouterModule }   from '@angular/router';
```

<h2>Конфигурация</h2>

```ts
import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprected';

import { HeroesComponent } from './components/heroes/heroes.component';
import { HeroDetailComponent } from '../hero-detail/hero-detail.component';

@RouteConfig([
  {
    path: '/',
    name: 'Heroes',
    component: HeroesComponent,
    useAsDefault: true
  },
  {
    path: '/detail/:id',
    name: 'HeroDetail',
    component: HeroDetailComponent
  }
])
@Component({
  selector: 'hero-app',
  template: '<router-outlet></router-outlet>',
  directives: [ROUTER_DIRECTIVES]
})
export class AppComponent {}
```

```ts
// routes.ts
import { provideRouter, RouterConfig } from '@angular/router';

import { HeroesComponent } from './components/heroes/heroes.component';
import { HeroDetailComponent } from './components/hero-detail/hero-detail.component';

export const appRoutes: RouterConfig = [
  { path: '', component: HeroesComponent, terminal: true },
  { path: 'detail/:id', component: HeroDetailComponent }
];

export const APP_ROUTER_PROVIDER = provideRouter(appRoutes);
```
