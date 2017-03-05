$(document).ready(function () {
	$('.schema-type-link').mouseenter(function (e) {
		$('.schema-popup').removeClass('active');
		$($(this).attr('href') + '-popup').addClass('active').css('left', e.pageX + 10).css('top', e.pageY + 10);
	}).mouseleave(function () {
		$('.schema-popup').removeClass('active');
	});
	$('.action-example .request .nav, .action-example .response .nav').each(function () {
		if ($(this).find('li.active').length == 0)
			$(this).find('a:first').tab('show');
	});
});