---
layout: post
title:  "Что такое Firefox Marionette Driver?"
date:   2016-07-15 00:19:29 +0300
category: Development
tags: [Firefox, Marionette, Selenium]
---
<img class="post-logo" src="https://blog.zverit.com/assets/marionette.png" />

**Marionette Driver** относится к инструментам для автоматизированного тестирования в Firefox.

Marionette представляет собой драйвер для удаленного управления  ПО построенными на основе Gecko платформе.
<!-- more -->

<blockquote>
<p><b>Gecko</b> — название движка отрисовки веб-страниц, разработанного в рамках проекта Mozilla. Изначально он назывался NGLayout.</p>
<p>Функциональность Gecko включает в себя чтение такого веб-содержимого, как HTML, CSS, XUL, JavaScript, и его отрисовку на экране пользователя или печать. В приложениях, основанных на XUL, Gecko также используется для отрисовки пользовательского интерфейса.</p>
<p>Gecko используется во многих приложениях, в том числе нескольких веб-браузерах — таких как Firefox, SeaMonkey, Camino и т. д.</p>
</blockquote>


**Marionette** представляет практически тот же API, что и **Selenium.WebDriver**. Что делает переход на новый вид драйвера совершенно «безболезненным». 

Для того чтобы использовать этот драйвер необходимо [скачать](https://github.com/mozilla/geckodriver/releases "GitHub release page.") `geckodriver` (ранее `wires`) и добавить путь к исполнимому файлу в переменные среды, либо положить рямом с бинарным файлом программы.

Используем `Marionette`. 

```cs
DesiredCapabilities capabilities = DesiredCapabilities.Firefox();
capabilities.SetCapability("marionette", true);

var driver = new RemoteWebDriver(capabilities); 
```

Как мы видим, практически ничего не изменилось с времен использования `WebDriver`, лишь добавилась строка `capabilities.SetCapability("marionette", true);`, которую, разработчики обещают, уберут в будущем и драйвер будет определяться автоматически. 

На данный момент (**ver. 2.53.1**) Selenium поддерживает этот драйвер не в полной мере. Например, в методе на загрузку плагинов пока стоит заглушка. Для серьезных целей пока рано переходить на новый драйвер.

Кстати говоря, совсем недавно вышел апдейт Selenium поддерживайщий последнюю версию **Firefox 47.0.1**. Хотя ходили волнения, что ее поддержки не будет. 


Так вот, поддержка WebDriver'а заканчивается от 48+ версии. А так как она пока нахдится на стадии беты и разработчики Selenium допиливают поддержку Marionette, используем WebDriver.
