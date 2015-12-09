/**
 * Created by f.alexsey on 10.08.14.
 */


$(document).on('click', '.list-image-item-remove, .list-file-item-remove', function () {
	var $item = $(this).parent().parent(),
		$input = $item.find('input'),
		type = $input.attr('data-type'),
		group = $input.attr('data-group'),
		fileId = $input.attr('data-id');

	$item.fadeOut(200);

	$.ajax({
		url: "./",
		type: "POST",
		data: {type: type, group: group, fileId: fileId, event: 'archivesFile'},
		cache: false,
		dataType: "json"
	});

	return false;
});