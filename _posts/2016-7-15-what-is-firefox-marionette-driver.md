---
layout: post
title:  "Что такое Firefox Marionette Driver"
date:   2016-07-15 00:19:29 +0300
category: Development
tags: [Firefox, Marionette, Selenium]
---
Marionette относится к инструментам для автоматизированного тестирования в Firefox.


Marionette представляет собой драйвер для удаленного управления  ПО построенными на основе Gecko платформе.
<!-- more -->

<blockquote>
<p>Gecko — название движка отрисовки веб-страниц, разработанного в рамках проекта Mozilla. Изначально он назывался NGLayout.</p>
<p>Функциональность Gecko включает в себя чтение такого веб-содержимого, как HTML, CSS, XUL, JavaScript, и его отрисовку на экране пользователя или печать. В приложениях, основанных на XUL, Gecko также используется для отрисовки пользовательского интерфейса.</p>
<p>Gecko используется во многих приложениях, в том числе нескольких веб-браузерах — таких как Firefox, SeaMonkey, Camino и т. д.</p>
</blockquote>


Marionette представляет практически тот же API что и Selenium.WebDriver. Что делает переход на новый вид драйвера совершенно «безболезненным». 

Для того чтобы использовать этот драйвер необходимо [скачать](https://github.com/mozilla/geckodriver/releases "GitHub release page.") `geckodriver` (ранее `wires`) и добавить путь к исполнимому файлу в переменные среды, либо положить рямом с бинарным файлом программы.

Используем `Marionette`. 

```cs
DesiredCapabilities capabilities = DesiredCapabilities.Firefox();
capabilities.SetCapability("marionette", true);

var driver = new RemoteWebDriver(capabilities); 
```

Как мы видим, практически ничего не изменилось с времен использования `WebDriver`, лишь добавилась строка `capabilities.SetCapability("marionette", true);`, которую, разработчики обещают, уберут в будущем и драйвер будет определяться автоматически. 
