import { DT } from './mod.js';
import {
	assert,
	assertAlmostEquals,
	assertEquals,
	assertFalse,
	assertMatch,
} from "jsr:@std/assert";

Deno.test({
	name: 'DT.nd',
	fn() {
		const date = DT.nd();
		assert(date instanceof Date);
		assertEquals(date.getTimezoneOffset(), new Date().getTimezoneOffset());
	},
});

Deno.test({
	name: 'DT.is',
	fn() {
		assert(DT.is('2023-01-01'));
		assert(DT.is(new Date()));
		assert(DT.is(1672531200000));
		assertFalse(DT.is('invalid'));
		assert(DT.is('2023-01-01 12:00:00'));
	},
});

Deno.test({
	name: 'DT.getFormatFromDate',
	fn() {
		assertEquals(DT.getFormatFromDate('2023-01-01'), DT.D_SQL);
		assertEquals(DT.getFormatFromDate('2023-01-01 12:00'), DT.DT_SQL);
		assertEquals(DT.getFormatFromDate(new Date()), DT.DT_SQL);
		assertEquals(DT.getFormatFromDate(1672531200000), DT.DT_SQL);
	},
});

Deno.test({
	name: 'DT.add',
	fn() {
		assertEquals(DT.add('2023-01-01', 1, 'd'), '2023-01-02');
		assertEquals(DT.add('2023-01-01', 1, 'M'), '2023-02-01');
		assertEquals(DT.add('2023-01-01', 1, 'Y'), '2024-01-01');
		assertEquals(DT.add('2023-01-01', 1, 'Q'), '2023-04-01');
		assertEquals(DT.add('2023-01-01 12:00:00', 1, 'h'), '2023-01-01 13:00:00');
	},
});

Deno.test({
	name: 'DT.isWorkingDay',
	fn() {
		assert(DT.isWorkingDay('2023-01-02')); // Monday
		assertFalse(DT.isWorkingDay('2023-01-01')); // Sunday
	},
});

Deno.test({
	name: 'DT.addWorkingDays',
	fn() {
		assertEquals(DT.addWorkingDays(1, '2023-01-01'), '2023-01-02'); // Sunday to Monday
		assertEquals(DT.addWorkingDays(5, '2023-01-02'), '2023-01-09'); // Monday to next Monday
	},
});

Deno.test({
	name: 'DT.diffD',
	fn() {
		assertEquals(DT.diffD('2023-01-02', '2023-01-01'), 1);
		assertEquals(DT.diffD('2023-01-01', '2023-01-02'), -1);
	},
});

Deno.test({
	name: 'DT.diffM',
	fn() {
		assertEquals(DT.diffM('2023-01-01 12:01:00', '2023-01-01 12:00:00'), 1);
	},
});

Deno.test({
	name: 'DT.diffSec',
	fn() {
		assertEquals(DT.diffSec('2023-01-01 12:00:01', '2023-01-01 12:00:00'), 1);
	},
});

Deno.test({
	name: 'DT.fromNow',
	fn() {
		const past = new Date(Date.now() - 60000); // 1 minute ago
		assertMatch(DT.fromNow(past), /мин\. назад/);
	},
});

Deno.test({
	name: 'DT.addRoundMonths',
	fn() {
		assertEquals(DT.addRoundMonths('2023-01-31', 1), '2023-02-28'); // Feb has 28 days
		assertEquals(DT.addRoundMonths('2023-01-15', 1), '2023-02-15');
	},
});

Deno.test({
	name: 'DT.getMonthDays',
	fn() {
		assertEquals(DT.getMonthDays('2023-01'), 31);
		assertEquals(DT.getMonthDays('2023-02'), 28); // 2023 not leap
		assertEquals(DT.getMonthDays('2024-02'), 29); // 2024 leap
	},
});

Deno.test({
	name: 'DT.format',
	fn() {
		assertEquals(DT.format('2023-01-01', 'Y-m-d'), '2023-01-01');
		assertEquals(DT.format('2023-01-01 12:00:00', 'H:i'), '12:00');
		assertEquals(DT.format(new Date('2023-01-01'), 'd.m.Y'), '01.01.2023');
		assertEquals(DT.format(1672531200000, 'U'), 1672531200000);
	},
});

Deno.test({
	name: 'DT.now',
	fn() {
		const now = DT.now();
		assertMatch(now, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
	},
});

Deno.test({
	name: 'DT.curdate',
	fn() {
		const curdate = DT.curdate;
		assertMatch(curdate, /^\d{4}-\d{2}-\d{2}$/);
	},
});

Deno.test({
	name: 'DT.isLeapYear',
	fn() {
		assert(DT.isLeapYear('2024-01-01'));
		assertFalse(DT.isLeapYear('2023-01-01'));
		assert(DT.isLeapYear(2024));
	},
});

