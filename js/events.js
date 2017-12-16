var siteTitle = document.getElementsByClassName('site-title')[0];
siteTitle.onclick = logoClick;

var pageLinkAboutMe = document.getElementsByClassName('page-link about-me')[0];
pageLinkAboutMe.onclick = pageLinkAboutMeClick;


var pagination = document.getElementsByClassName('pagination')[0];
pagination.onclick = paginationClick;

function logoClick() {
	ga('send', {
  'hitType': 'event',
  'eventCategory': 'Navigation',
  'eventAction': 'Click',
  'eventLabel': 'Logo'});
}

function pageLinkAboutMeClick() {
	ga('send', {
  'hitType': 'event',
  'eventCategory': 'Navigation',
  'eventAction': 'Click',
  'eventLabel': 'PageLink'});
}

function pageLinkAboutMeClick() {
	ga('send', {
  'hitType': 'event',
  'eventCategory': 'Navigation',
  'eventAction': 'Click',
  'eventLabel': 'Pagination'});
}