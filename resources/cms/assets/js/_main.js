/**
 * Created by xpundel on 02.03.15.
 */

// --  /= ../../../bower_components/jquery/dist/jquery.min.js
// --- /= ../../../bower_components/fancybox/source/jquery.fancybox.pack.js

var listEditor = {};


$(document).ready(function () {
	$('.add-new-item').on('click', function () {
		$.ajax({
			url: "./",
			type: "PUT",
			dataType: "json"
		}).done(function (json) {
			var addUrl;
			if ($('.add-new-item').data('edit-button')) {
				addUrl = $('.add-new-item').data('edit-button') + '/';
			} else {
				addUrl = '';
			}
			document.location.href = location.pathname + json.id + '/' + addUrl;
		});
	});


	$(document).on('click', '.add-new-subform-item', function () {
		var button = $(this);
		var objectName = $(this).closest('[data-object-name]').data('object-name');
		var url = './';

		// для вложенных-вложенных форм
		if ($(this).closest('[data-object-name]').closest('[data-object-id]').length) {
			var parentObjectId = $(this).closest('[data-object-name]').closest('[data-object-id]').data('object-id')
			var parentObjectName = $(this).closest('[data-object-name]').closest('[data-object-id]').closest('[data-object-name]').data('object-name')
			url += parentObjectName + '/' + parentObjectId + '/';
		}
		url += objectName + '/';
		$.ajax({
			url: url,
			type: 'PUT',
			dataType: 'html'
		}).done(function ($tr) {
			/* TODO: вариант для таблиц и для дивов */
			button.prev().append($tr)
		});
		return false;
	});

	$(document).on('click', '.nested-form .nested-form-item .remove-button', function () {
		var objectName = $(this).closest('[data-object-name]').data('object-name');
		var listItem = $(this).closest('[data-object-id]');
		var objectId = listItem.data('object-id');
		swal({
			title: "",
			text: "Действительно удалить эту запись?",
			type: "warning",
			animation: "none",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			cancelButtonText: "Нет",
			confirmButtonText: "Да",
			closeOnConfirm: false
		}, function () {
			$.ajax({
				url: './' + objectName + '/' + objectId + '/',
				type: 'DELETE',
			}).done(function ($tr) {
				/* TODO: вариант для таблиц и для дивов */
				listItem.remove();
				swal.close();
			});
		});
		return false;
	})

	$('.datepicker').each(function () {
		var picker = new Pikaday({
			field: $(this)[0],
			theme: 'dark-theme',
			format: 'DD.MM.YYYY',
			firstDay: 1,
			i18n: {
				previousMonth: 'Предыдущий месяц',
				nextMonth: 'Следующий месяц',
				months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
				weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
				weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
			}
		});
	});
	$('.datepicker + .clear-date').on('click', function () {
		$(this).prev().val('');
	});

	$('.cms-page .module-content .cms-module-list table td button.status ').on('click', function () {
		var tr = $(this).closest('tr')
		$.ajax({
			url: "./" + tr.data('id') + "/",
			data: {status: true},
			type: "POST"
		}).done(function () {
			tr.toggleClass('inactive');
		});
	});

	$('.cms-page a.button.delete ').on('click', function () {
		var url = $(this).attr('href');
		swal({
			title: "",
			text: "Действительно удалить эту запись?",
			type: "warning",
			animation: "none",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			cancelButtonText: "Нет",
			confirmButtonText: "Да",
			closeOnConfirm: false
		}, function () {
			document.location.href = url;
		});
		return false;
	});

	$('.cms-page .module-content .cms-module-list table td button.delete ').on('click', function () {
		var tr = $(this).closest('tr')
		swal({
			title: "",
			text: "Действительно удалить эту запись?",
			type: "warning",
			animation: "none",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			cancelButtonText: "Нет",
			confirmButtonText: "Да",
			closeOnConfirm: false
		}, function () {
			$.ajax({
				url: "./" + tr.data('id') + "/",
				type: "DELETE"
			}).done(function () {
				swal.close();
				tr.remove();
			});
		});
	});
	$('tr[data-row-for-field="type"][data-row-for-object="user"] select').on('change', function () {
		if ($(this).val() == 100) {
			$('tr[data-row-for-field="acl"][data-row-for-object="user"]').hide();
		} else {
			$('tr[data-row-for-field="acl"][data-row-for-object="user"]').show();
		}
	}).trigger('change');


	$('.cms-page .two-column-layout .nav-panel .filter input').on('keyup', function () {
		var filterText = $(this).val();
		simpleStorage.set('objectsFilter', filterText);

		if (filterText.length > 1) {
			$('.cms-page .two-column-layout .nav-panel').addClass('has-filter');
		} else {
			$('.cms-page .two-column-layout .nav-panel').removeClass('has-filter');
		}

		$('.cms-page .two-column-layout .nav-panel li').removeClass('filtered')
		$('.cms-page .two-column-layout .nav-panel li[data-name]').each(function () {
			if ($(this).data('name')) {
				$(this).find('>a:not(.fa)').html($(this).data('name'));
				if ($(this).data('name').toString().toLowerCase().indexOf(filterText.toLowerCase()) > -1) {
					$(this).parents('li').add($(this)).addClass('filtered');

					if (filterText.length > 1) {
						var reg = new RegExp(filterText, 'gi');
						$(this).find('>a:not(.fa)').html($(this).data('name').replace(reg, function (str) {
							return '<span>' + str + '</span>'
						}));
					}

				}
			}
		})
	})

	if ($('.cms-page .two-column-layout').length) {
		$('.cms-page .two-column-layout .nav-panel .filter input').val(simpleStorage.get('objectsFilter')).trigger('keyup');

		if ($('.cms-page .two-column-layout .nav-panel li.active').length) {
			$('.cms-page .two-column-layout .nav-panel')[0].scrollTop = $('.cms-page .two-column-layout .nav-panel li.active').offset().top - 200;
		}

		$(document).on('scroll', function () {
			if ($(document).scrollTop() >= $('.cms-page .two-column-layout .main-panel').offset().top) {
				$('.cms-page .two-column-layout .nav-panel').css('position', 'fixed').css('top', 0);
			} else {
				$('.cms-page .two-column-layout .nav-panel').css('position', 'absolute').css('top', '');
			}
		});
	}

	if ($('#SaveForm').data('form-saved')) {
		setTimeout(function () {
			ohSnap($('#SaveForm').data('form-saved'), 'green');
		}, 300);
	}
});


$(document).on('click', 'input[name="clone-map"]', function () {
	$.ajax({
		url: "./",
		type: "POST",
		data: {ajaxCms: 'cloneObject'},
		dataType: "json"
	}).done(function (data) {
		var url = document.location.href.replace(/\/?$/, '').replace(/\d+$/, data.id) + '/';
		document.location.href = url;
	});
	return false;
});

