window.onload = function () {
	var siteTitle = document.getElementsByClassName('site-title')[0];
	siteTitle.onclick = logoClick;

	var pageLinkAboutMe = document.getElementsByClassName('page-link about-me')[0];
	pageLinkAboutMe.onclick = pageLinkAboutMeClick;


	var pagination = document.getElementsByClassName('pagination')[0];
	if (pagination) {
		pagination.onclick = paginationClick;
	}

	var related = document.getElementsByClassName('related')[0];
	if (related) {
		related.onclick = relatedClick;
	}
	
	var share = document.getElementsByClassName('share-buttons')[0];
	if (share) {
		share.onclick = shareClick;
	}
	
	var pageLinkArchve = document.getElementsByClassName('page-link archive')[0];
	pageLinkArchive.onclick = pageLinkArchiveClick;
	
	var pageLinkCategory = document.getElementsByClassName('page-link category')[0];
	pageLinkCategory.onclick = pageLinkCategoryClick;
	
	var pageLinkTags = document.getElementsByClassName('page-link tags')[0];
	pageLinkTags.onclick = pageLinkTagsClick;
	
	
	var rss = document.getElementsByClassName('rss-subscribe')[0];
	rss.onclick = rssClick;
	
	var shareButtons =  document.getElementsByClassName('share-buttons')[0];
	if(shareButtons) {
		shareButtons.onclick = shareClick;
	}

	function rssClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Subscribe',
	  'eventAction': 'Click',
	  'eventLabel': 'RSS'});
	}	
	
	function pageLinkArchveClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Archive'});
	}
	
	function pageLinkCategoryClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Category'});
	}
	
	function pageLinkTagsClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Tags'});
	}
	
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
	  'eventLabel': 'AboutMePageLink'});
	}

	function paginationClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Pagination'});
	}
	
	function relatedClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Related'});
	}
	
	function shareClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Share',
	  'eventAction': 'Click',
	  'eventLabel': 'Share Buttons'});
	}
}
