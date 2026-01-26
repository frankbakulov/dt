/* @ts-self-types="./mod.d.ts" */
const timezoneOffset = new Date().getTimezoneOffset() * 60000;

export const DT = {
	nd: function () {
		return new Date(Date.now() - timezoneOffset);
	},
	locale: {
		weekdays: {
			shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
			longhand: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
		},
		months: {
			shorthand: [null, 'Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
			longhand: [null, 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
			parental: [null, 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
				'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
		},
		rangeSeparator: ' — ',
	},

	WorkingWeekdays: [1, 2, 3, 4, 5],
	NonWorkingDates: [],

	ruUnits: {
		'год': 'Y',
		'календарный день': 'd',
		'квартал': 'Q',
		'месяц': 'M',
		'неделя': 'w',
		'рабочий день': 'workingDay',
	},

	// this.TimeZone = context.UserId ? getUserDetails(context.UserId).TimeZone.IanaId : null;
	WorkingSatSun: [], // рабочие сб, вс

	// форматы представления дат
	// d - день, m - месяц, Y - год, H - часы, i - минуты, S - секунды
	D_STD: 'd.m.Y',
	T_STD: 'H:i',
	D_SQL: 'Y-m-d',
	T_SQL: 'H:i:S',
	get DT_STD() { return this.D_STD + ' ' + this.T_STD; },
	get DT_SQL() { return this.D_SQL + ' ' + this.T_SQL; },
	/**
	 * Проверка, является ли сущность датой
	 * @param {Date|String} d
	 * @returns {Boolean}
	 */
	is: function (d) {
		// '0000(-.)00(-.)00(T )00:00(:00)(.000)(Z)'

		const rx_d = /^\d{1,4}([-/.])\d{1,2}\1\d{1,4}$/;
		const rx_t = /^\d{1,2}:\d{1,2}(:\d{1,2})?(\.\d+)?Z?$/;
		const rx_dt = /^\d{1,4}([-/.])\d{1,2}\1\d{1,4}[\sT]\d{1,2}:\d{1,2}(:\d{1,2})?(\.\d+)?Z?$/;

		return Boolean(
			d instanceof Date ||
			typeof d === 'number' ||
			(d && (
				rx_d.test(d) && d.match(/[1-9]/)
				|| rx_t.test(d)
				|| rx_dt.test(d) && d.match(/^([\d-]+)/)?.[1]?.match(/[1-9]/)
			))
		);
	},

	getFormatFromDate: function (input_dt) {
		return (input_dt instanceof Date || typeof input_dt === 'number') ? this.DT_SQL : (input_dt.includes(':') ? this.DT_SQL : this.D_SQL);
	},

	/**
	 * Добавление времени
	 * @param {Date|String} input_dt изначальная дата/время
	 * @param {Number} add количество добавляемых единиц
	 * @param {String} unit добавляемая единица
	 * (M - месяц, s - секунда, m - минута, h - час, d - день)
	 * @param {String} format формат вывода даты
	 * @returns {String} новое время в нужном формате
	 */
	add: function (input_dt, add, unit, format = '') {
		if (this.ruUnits[unit]) {
			unit = this.ruUnits[unit];
		}

		if (unit === 'workingDay') {
			return this.addWorkingDays(add, input_dt, format);
		}

		format ||= this.getFormatFromDate(input_dt);

		let ms = +this.format(input_dt, 'U');
		if (add) {
			if (['M', 'Q', 'Y'].includes(unit)) {
				ms = new Date(ms);

				ms = unit === 'Y'
					? ms.setFullYear(ms.getFullYear() + add)
					: ms.setMonth(ms.getMonth() + add * (unit === 'Q' ? 3 : 1));
			} else {
				const multi = {
					s: 1000, m: 60000, h: 3600000, d: 86400000, w: 7 * 86400000,
				}, m = multi[unit];

				if (!m) throw new Error(`Wrong data multiplier: "${unit}", allowed: ${Object.keys(multi).join()}`);
				ms += add * m;
			}
		}

		return this.format(new Date(ms), format);
	},

	isWorkingDay: function (input_dt) {
		var dt = input_dt instanceof Date ? this.format(input_dt, this.D_SQL) : input_dt;
		return (
			(~this.WorkingWeekdays.indexOf(this.format(dt, 'w')) && !~this.NonWorkingDates.indexOf(dt)) ||
			~this.WorkingSatSun.indexOf(dt)
		);
	},
	/**
	 * Добавление к дате рабочих дней.
	 * Рабочие дни указываются во вкладке Аккаунт в Case.One
	 * @param {Number} add Количество добавляемых рабочих дней
	 * если add === 0 - возвращает ближайший рабочий день
	 * @param {Date|String} input_dt Начальная дата
	 * @returns {String} Дата в формате 'Y-m-d'
	 */
	addWorkingDays: function (add, input_dt = '', format = null) {
		input_dt ||= this.curdate;
		add = Math.round(add);

		const working = (input_dt) =>
			(~this.WorkingWeekdays.indexOf(this.format(input_dt, 'w')) && !~this.NonWorkingDates.indexOf(input_dt)) ||
			~this.WorkingSatSun.indexOf(input_dt);

		format ||= this.getFormatFromDate(input_dt);

		input_dt = this.format(input_dt, format);

		if (!add) {
			// если рабочий, то вернёт текущий день
			add = 1; // иначе, первый следующий рабочий
			while (!working(input_dt)) {
				input_dt = this.add(input_dt, add, 'd', this.D_SQL);
			}
			return input_dt;
		}

		let inc = add >= 0 ? 1 : -1,
			safety = 999;

		input_dt = this.add(input_dt, inc, 'd', format); // не учитываем текущий день

		while (--safety) {
			if (!safety) throw new Error(`Зациклился DT.addWorkingDays для ${input_dt} + ${add}`);

			working(input_dt) && (add += -1 * inc);

			if (!add) break;

			input_dt = this.add(input_dt, inc, 'd', format);
		}

		return input_dt;
	},
	/**
	 * Вычисление разницы между датами в днях
	 * @param {Date|String} dt1 Дата 1
	 * @param {Date|String} dt0 Дата 2
	 * @returns {Number} Разница между датами в днях
	 */
	diffD: function (dt1, dt0) {
		return Math.round((+this.format(dt1, 'U') - +this.format(dt0, 'U')) / 86400000);
	},
	/**
	 * Вычисление разницы между датами в минутах
	 * @param {Date|String} dt1 Дата 1
	 * @param {Date|String} dt0 Дата 2
	 * @returns {Number} Разница между датами в минутах
	 */
	diffM: function (dt1, dt0) {
		return Math.round((+this.format(dt1, 'U') - +this.format(dt0, 'U')) / 60000);
	},
	/**
	 * Вычисление разницы между датами в секундах
	 * @param {Date|String} dt1 Дата 1
	 * @param {Date|String} dt0 Дата 2
	 * @returns {Number} Разница между датами в секундах
	 */
	diffSec: function (dt1, dt0) {
		return Math.round((+this.format(dt1, 'U') - +this.format(dt0, 'U')) / 1000);
	},
	/**
	 * Вычисляет, сколько времени прошло с введённой даты (до настоящего момента)
	 * @param {Date|String} input_dt
	 * @returns {String} Возвращает прошедшее время в человекочитаемом формате
	 */
	fromNow: function (input_dt) {
		let ms = Date.now() - +this.format(input_dt, 'U'),
			r = '';

		switch (true) {
			case ms < 60000:
				return 'только что';
			case ms < 3600000:
				r = Math.round(ms / 60000) + ' мин.';
				break;
			default:
				r = Math.round(ms / 3600000) + ' ч.';
		}

		return r + ' назад';
	},

	addRoundMonths: function (input_dt, add) {
		var getDaysInMonth = (year, month) => {
			return [31, (this.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		};

		const tmp = new Date(input_dt);
		var n = +tmp.toISOString().slice(8, 10);
		tmp.setDate(1);
		tmp.setMonth(+tmp.toISOString().slice(5, 7) + add - 1);

		// установка последнего дня месяца в случае отсутствия дня(например в феврале)
		n = Math.min(n, getDaysInMonth(tmp.getFullYear(), tmp.getMonth()));
		return this.format(tmp.toISOString().replace(/^(\d+-\d+-)\d+/, '$1' + n), this.D_SQL);
	},

	getMonthDays: function (Ym) {
		const [Y, m] = Ym.split('-');
		return new Date(+Y, +m, 0).getDate();
	},

	/**
	 * Форматирование даты
	 * @param {Date|String} input_dt Входная дата в любом формате
	 * @param {String} format Формат даты.
	 * (Можно использовать константы выше (D_STD, D_STD, T_STD, D_SQL, T_SQL, DT_STD, DT_SQL)
	 * или написать самому - https://flatpickr.js.org/formatting/)
	 * @returns {Number|String} Если формат простой (1 символ) -
	 * то возвращается число или строка, иначе - строка
	 */
	format: function (input_dt, format = '') {
		if (!input_dt) return '';
		let dt;
		if (input_dt instanceof Date) {
			dt = input_dt;
		} else if (typeof input_dt === 'number') {
			dt = new Date(input_dt);
		} else {
			if (typeof input_dt === 'object') {
				throw new Error('Некорректное значение на входе DT.format - ' + JSON.stringify(input_dt));
			}

			!format && input_dt.includes(':') && (format = this.DT_SQL);

			input_dt = input_dt
				.replace(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, '$3-$2-$1')
				.replace(/-(\d\b)/g, '-0$1');

			if (!input_dt.match(/\d+:\d+:\d+/)) {
				if (!input_dt.includes(':')) {
					input_dt += ' 00:00';
				}
				input_dt += ':00.000Z';
			}

			input_dt = input_dt.replace(' ', 'T').replace(/(\D)(\d):/g, '$10$2:');

			if (!input_dt.endsWith('Z')) {
				input_dt.match(/\.\d+$/) || (input_dt += '.000');
				input_dt += 'Z';
			}

			dt = this.is(input_dt) ? new Date(input_dt) : this.nd();

			// Invalid Date
			if (isNaN(dt.getTime())) return '';
		}


		if (format === 'UTC') {
			return dt.toISOString();
		}

		format || (format = this.D_SQL);

		let length = format.length,
			i = -1,
			r = '';

		// native methods are affected by timezone. We have to get dt-parts from string representation
		var [_, year, month, day, hour, minute, second] = dt.toISOString().match(/^(\d+)-(\d+)-(\d+).(\d+):(\d+):(\d+)\.(\d+)/) || [];
		while (++i < length) {
			const f = format[i];
			let d = f; // to keep symbol in case it's not in a format
			switch (f) {
				case 'd': case 'j': //case 'J' // 1st 2nd 3rd
					d = +day;
					d < 10 && f === 'd' && (d = '0' + d);
					break;
				case 'D': case 'l': case 'w':
					d = dt.getUTCDay();
					if (f === 'l') {
						d = this.locale.weekdays.longhand[d];
					} else if (f === 'D') {
						d = this.locale.weekdays.shorthand[d];
					}
					break;
				// case 'W': // 0..52
				case 'F': case 'f': case 'M': case 'm': case 'n':
					d = +month;
					if (f === 'F') {
						d = this.locale.months.longhand[d];
					} else if (f === 'f') {
						d = this.locale.months.parental[d];
					} else if (f === 'M') {
						d = this.locale.months.shorthand[d];
					} else {
						d < 10 && f === 'm' && (d = '0' + d);
					}
					break;
				case 'y': case 'Y':
					d = year;
					f === 'y' && (d = d.slice(2));
					break;
				case 'U':
					d = dt.getTime();
					break;
				case 'H': case 'G': // case 'h': // 4 am
					d = +hour;
					d < 10 && f === 'H' && (d = '0' + d);
					break;
				case 'i':
					d = +minute;
					d < 10 && (d = '0' + d);
					break;
				case 'S': case 's':
					d = +second;
					d < 10 && f === 'S' && (d = '0' + d);
					break;
				// case 'K': // AM/PM
			}

			// для сохранения типа данных, если формат простой
			if (f === format) return d;

			// иначе всегда строка
			r += d;
		}

		return r;
	},
	/**
	 * Возвращает текущую дату и время
	 * @param {String} format Формат вывода.
	 * (Можно использовать константы выше (D_STD, D_STD, T_STD, D_SQL, T_SQL, DT_STD, DT_SQL)
	 * или написать самому - https://flatpickr.js.org/formatting/)
	 * @returns {Number|String} Текущее время
	 */
	now: function (format) { return this.format(Date(), format || this.D_SQL + ' ' + this.T_SQL); },
	/**
	 * Текущая дата в формате 'Y-m-d'
	 */
	get curdate() { return this.format(this.nd(), this.D_SQL); },
	/**
	 * Проверка года на високосность
	 * @param {Date|String|Number} input_dt Дата или отдельный год
	 * @returns {Boolean} Вискосный год или нет
	 */
	isLeapYear: function (input_dt) {
		const dt = input_dt instanceof Date ? input_dt : (input_dt ? new Date(String(input_dt)) : this.nd());
		const year = +dt.toISOString().slice(0, 4);
		return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
	},
};