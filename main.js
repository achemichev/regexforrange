onst exactly_one_digit_mask = '_';
const exactly_one_digit_re = /_/g;

/*****************************************************************************/

function split_to_patterns(min_, max_) {
    var stops, start, subpatterns;
    start = min_;
    subpatterns = [];
    stops = split_to_ranges(min_, max_);
    stops.forEach(function (stop) {
        subpatterns.push(range_to_pattern(start, stop));
        start = stop + 1;
    });
    subpatterns = join_ranges(subpatterns);
    return subpatterns;
} // split_to_patterns()

/*****************************************************************************/

function split_to_ranges(min_, max_) {
    var stops, nines_count, stop, zeros_count;
    stops = [max_];
    nines_count = 1;
    stop = fill_by_nines(min_, nines_count);
    while (min_ <= stop && stop < max_) {
        stops.push(stop);
        nines_count += 1;
        stop = fill_by_nines(min_, nines_count);
    }
    zeros_count = 1;
    stop = fill_by_zeros(max_ + 1, zeros_count) - 1;
    while (min_ < stop && stop <= max_) {
        stops.push(stop);
        zeros_count += 1;
        stop = fill_by_zeros(max_ + 1, zeros_count) - 1;
    }
    stops = uniq(stops);
    stops.sort(function (a, b) {
        return a - b;
    });
    return stops;
} // split_to_ranges()

/*****************************************************************************/

function fill_by_nines(integer, nines_count) {
    var int_str, len, end, rest, pad;
    int_str = integer.toString();
    len = int_str.length;
    end = nines_count > len ? 0 : (len - nines_count);
    rest = int_str.slice(0, end);
    pad = (new Array(nines_count + 1)).join('9');
    return parseInt(rest + '' + pad, 10);
} // fill_by_nines()

/*****************************************************************************/

function fill_by_zeros(integer, zeros_count) {
    var int_str, len, end, rest, pad;
    int_str = integer.toString();
    len = int_str.length;
    end = zeros_count > len ? 0 : (len - zeros_count);
    rest = int_str.slice(0, end);
    pad = (new Array(zeros_count + 1)).join('0');
    return parseInt(rest + '' + pad, 10);
} // fill_by_zeros()

/*****************************************************************************/

function uniq(a) {
    var seen = {};
    return a.filter(function (item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
} // uniq()

/*****************************************************************************/

function range_to_pattern(start, stop) {
    var i, start_digit, stop_digit, pattern, any_digit_count, start_,
        stop_, digit_pairs /*, err_msg*/;
    pattern = '';
    any_digit_count = 0;
    start_ = start.toString().split('');
    stop_ = stop.toString().split('');
    if (start_.length != stop_.length) {
        err_msg = '\tstart = ' + start + ', stop = ' + stop +
            ', unexpected range_match in range_to_pattern()';
        err_msg_inform(err_msg);
    }
    digit_pairs = zip([start_, stop_]);
    for (i = 0; i < digit_pairs.length; i++) {
        start_digit = digit_pairs[i][0];
        stop_digit = digit_pairs[i][1];
        if (start_digit == stop_digit)
            pattern += start_digit;
        else if (start_digit != '0' || stop_digit != '9')
            pattern += '[' + start_digit + '-' + stop_digit + ']';
        else
            any_digit_count += 1;
    }
    if (any_digit_count)
        pattern += (new Array(any_digit_count + 1)).join(exactly_one_digit_mask);
    return pattern;
} // range_to_pattern()

/*****************************************************************************/

function zip(arrays) {
    return arrays[0].map(function (_, i) {
        return arrays.map(function (array) {
            return array[i];
        });
    });
} // zip()

/*****************************************************************************/

function join_ranges(subpatterns) {
    var i, k, subpatterns_clone, modified_flag, cur, next, cur_range_split, next_range_split;
    subpatterns_clone = subpatterns.slice(0);
    modified_flag = 1;
    while (modified_flag)
        for (i = 0, modified_flag = 0; i < subpatterns_clone.length - 1; i++) {
            cur = subpatterns_clone[i];
            next = subpatterns_clone[i + 1];
            cur_range_split = get_range_split(cur);
            next_range_split = get_range_split(next);
            if (cur_range_split && next_range_split)
                modified_flag = join_ranges_split_to_split(cur_range_split,
                    next_range_split, subpatterns_clone, i);
            else if (!cur_range_split && next_range_split)
                modified_flag = join_ranges_string_to_split(cur, next_range_split,
                    subpatterns_clone, i);
            else if (cur_range_split && !next_range_split)
                modified_flag = join_ranges_split_to_string(cur_range_split, next,
                    subpatterns_clone, i);
            else if (!cur_range_split && !next_range_split)
                modified_flag = join_ranges_string_to_string(cur, next,
                    subpatterns_clone, i);
            if (modified_flag)
                break; // break for;
        } // for
    return subpatterns_clone;
} // join_ranges()

/*****************************************************************************/

function join_ranges_split_to_split(cur_range_split, next_range_split, subpatterns, i) {
    var modified_flag, new_range;
    modified_flag = 0;
    if (cur_range_split.left == next_range_split.left &&
        cur_range_split.right == next_range_split.right &&
        cur_range_split.to == next_range_split.from - 1) {
        new_range = '[' + cur_range_split.from + '-' + next_range_split.to + ']';
        if (new_range == '[0-9]')
            new_range = exactly_one_digit_mask;
        subpatterns[i + 1] = cur_range_split.left +
            new_range +
            cur_range_split.right;
        subpatterns.splice(i, 1); // remove i-th element
        modified_flag = 1;
    }
    return modified_flag;
} // join_ranges_split_to_split()

/*****************************************************************************/

function join_ranges_string_to_split(cur, next_range_split, subpatterns, i) {
    var cur_left, cur_right, cur_digit, new_range, modified_flag;
    cur_left = cur.slice(0, next_range_split.left.length);
    cur_right = cur.slice(-next_range_split.right.length);
    cur_digit = null;
    modified_flag = 0;
    if ((cur_left || cur_left == '') && (cur_right || cur_right == ''))
        cur_digit = cur.slice(cur_left.length, -cur_right.length);
    if (cur_left == next_range_split.left &&
        cur_right == next_range_split.right &&
        cur_digit && cur_digit.length == 1 &&
        cur_digit == next_range_split.from - 1) {
        new_range = '[' + cur_digit + '-' + next_range_split.to + ']';
        if (new_range == '[0-9]')
            new_range = exactly_one_digit_mask;
        subpatterns[i + 1] = cur_left + new_range + cur_right;
        subpatterns.splice(i, 1); // remove i-th element
        modified_flag = 1;
    }
    return modified_flag;
} // join_ranges_string_to_split()

/*****************************************************************************/

function join_ranges_split_to_string(cur_range_split, next, subpatterns, i) {
    var modified_flag, next_left, next_right, next_digit, new_range;
    next_left = next.slice(0, cur_range_split.left.length);
    next_right = next.slice(-cur_range_split.right.length);
    next_digit = null;
    modified_flag = 0;
    if ((next_left || next_left == '') && (next_right || next_right == ''))
        next_digit = next.slice(next_left.length, -next_right.length);
    if (cur_range_split.left == next_left &&
        cur_range_split.right == next_right &&
        next_digit && next_digit.length == 1 &&
        cur_range_split.to + 1 == next_digit) {
        new_range = '[' + cur_range_split.from + '-' + next_digit + ']';
        if (new_range == '[0-9]')
            new_range = exactly_one_digit_mask;
        subpatterns[i + 1] = next_left + new_range + next_right;
        subpatterns.splice(i, 1); // remove i-th element
        modified_flag = 1;
    }
    return modified_flag;
} // join_ranges_split_to_string()

/*****************************************************************************/

function join_ranges_string_to_string(cur, next, subpatterns, i) {
    var k, diff_digit_pairs, min_len, cur_digit, next_digit, digit_rank, new_range, modified_flag;
    diff_digit_pairs = [];
    min_len = cur.length <= next.length ? cur.length : next.length;
    for (k = 0; k < min_len; k++)
        if (cur[k] != next[k])
            diff_digit_pairs.push([cur[k], next[k], k]);
    cur_digit = diff_digit_pairs[0][0];
    next_digit = diff_digit_pairs[0][1];
    digit_rank = diff_digit_pairs[0][2];
    modified_flag = 0;
    if (cur.length == next.length &&
        diff_digit_pairs.length == 1 &&
        cur_digit == next_digit - 1) {
        new_range = '[' + cur_digit + '-' + next_digit + ']';
        /*
         * if (new_range == '[0-9]')
         *     new_range = exactly_one_digit_mask;
         */
        subpatterns[i + 1] = next.slice(0, digit_rank) +
            new_range +
            next.slice(digit_rank + 1);
        subpatterns.splice(i, 1); // remove i-th element
        modified_flag = 1;
    }
    return modified_flag;
} // join_ranges_string_to_string()

/*****************************************************************************/

function expand_patterns(subpatterns) {
    var k, expanded, range_split;
    expanded = [];
    subpatterns.forEach(function (subpattern) {
        if ((range_split = get_range_split(subpattern)))
            for (k = range_split.from; k <= range_split.to; k++)
                expanded.push('' + range_split.left + k + range_split.right);
        else expanded.push(subpattern);
    }); // forEach
    return expanded;
} // expand_patterns()

/*****************************************************************************/

function get_range_split(subpattern) {
    var range_match_result, range_split;
    range_split = null;
    range_match_result = subpattern.match(/\[([^\[\]]+)\]/g);
    if (range_match_result && range_match_result.length == 1) {
        range_split = {};
        range_split.left = subpattern.split('[')[0];
        range_split.right = subpattern.split(']')[1];
        range_split.from = range_match_result[0].split('-')[0].slice(1);
        range_split.to = range_match_result[0].split('-')[1].slice(0, -1);
    }
    else if (range_match_result && range_match_result.length > 1) {
        err_msg = '\tsubpattern = ' + subpattern +
            ', unexpected range_match_result in expand_patterns()';
        err_msg_inform(err_msg);
    }
    return range_split;
} // get_range_split()

/*****************************************************************************/

function verify(fun, actual, expected) {
    var err_msg;
    if (actual != expected) {
        err_msg = '\t' + fun + ' failed:\n\t\tactual = "' +
            actual + '"\n\t\texpected = "' + expected + '"\n\n';
        err_msg_inform(err_msg);
    }
} // verify()

/*****************************************************************************/

function regex_for_range(min_, max_) {
    var subpatterns;
    subpatterns = split_to_patterns(min_, max_);
    subpatterns = expand_patterns(subpatterns);
    return subpatterns.join('|');
} // regex_for_range()

/*****************************************************************************/

function verify_regex(min_, max_, expected) {
    var regex, err_msg;
    regex = regex_for_range(min_, max_);
    if (regex != expected) {
        err_msg = '\tverify_regex(' + min_ + ', ' + max_ + ') failed:\n\t\tregex = "' +
            regex + '"\n\t\texpected = "' + expected + '"\n\n';
        err_msg_inform(err_msg);
    }
} // verify_regex()

/*****************************************************************************/

function verify_range(min_, max_, from_min_, to_max_) {
    var regex, bounded_regex_js, nr, err_msg;
    regex = regex_for_range(min_, max_);
    bounded_regex_js =
        new RegExp('\\b' + regex.replace(exactly_one_digit_re, '\\d').replace(/\|/g, '\\b|\\b') + '\\b');
    err_msg = '';
    for (nr = from_min_; nr <= to_max_ + 1; nr++)
        if (min_ <= nr && nr <= max_ && !bounded_regex_js.test(nr.toString())) {
            err_msg = 'failed';
            break;
        }
        else if ((nr < min_ || max_ < nr ) && bounded_regex_js.test(nr.toString())) {
            err_msg = 'false positive';
            break;
        }
    if (err_msg && err_msg.length > 0) {
        err_msg = '\tverify_range(' + min_ + ',' + max_ + ') ' +
            err_msg + ':\n\t\tregex = "' + regex + '"\n\t\tnr = ' + nr + '\n\n';
        err_msg_inform(err_msg);
    }
} // verify_range()

/*****************************************************************************/

function err_msg_inform(err_msg) {
    // console.log(err_msg);
    throw err_msg;
} // err_msg_inform()

/*****************************************************************************/

function check() {

    // test subroutines

    verify('fill_by_nines(255, 4)', fill_by_nines(255, 4), 9999);
    verify('fill_by_nines(255, 3)', fill_by_nines(255, 3), 999);
    verify('fill_by_nines(255, 2)', fill_by_nines(255, 2), 299);
    verify('fill_by_nines(255, 1)', fill_by_nines(255, 1), 259);
    verify('fill_by_nines(255, 0)', fill_by_nines(255, 0), 255);

    verify('fill_by_zeros(255, 4)', fill_by_zeros(255, 4), 0);
    verify('fill_by_zeros(255, 3)', fill_by_zeros(255, 3), 0);
    verify('fill_by_zeros(255, 2)', fill_by_zeros(255, 2), 200);
    verify('fill_by_zeros(255, 1)', fill_by_zeros(255, 1), 250);
    verify('fill_by_zeros(255, 0)', fill_by_zeros(255, 0), 255);

    verify('split_to_ranges(10, 312)', split_to_ranges(10, 312).toString(), '19,99,299,309,312');
    verify('range_to_pattern(10, 19)', range_to_pattern(10, 19), '1_');
    verify('range_to_pattern(20, 99)', range_to_pattern(20, 99), '[2-9]_');

    // test_quality 1

    verify('split_to_patterns(10, 312)', split_to_patterns(10, 312).toString(), '[1-9]_,[1-2]__,30_,31[0-2]');
    verify('split_to_patterns(77, 244)', split_to_patterns(77, 244).toString(), '7[7-9],[8-9]_,1__,2[0-3]_,24[0-4]');
    verify('split_to_patterns(1, 1)', split_to_patterns(1, 1).toString(), '1');
    verify('split_to_patterns(0, 1)', split_to_patterns(0, 1).toString(), '[0-1]');
    verify('split_to_patterns(0, 10)', split_to_patterns(0, 10).toString(), '_,10');
    verify('split_to_patterns(0, 2)', split_to_patterns(0, 2).toString(), '[0-2]');
    verify('split_to_patterns(65666, 65667)', split_to_patterns(65666, 65667).toString(), '6566[6-7]');
    verify('split_to_patterns(1, 19)', split_to_patterns(1, 19).toString(), '[1-9],1_');
    verify('split_to_patterns(1, 99)', split_to_patterns(1, 99).toString(), '[1-9],[1-9]_');
    verify('split_to_patterns(102, 130)', split_to_patterns(102, 130).toString(), '10[2-9],1[1-2]_,130');
    verify('split_to_patterns(100, 201)', split_to_patterns(100, 201).toString(), '1__,20[0-1]');
    verify('split_to_patterns(77, 244)', split_to_patterns(77, 244).toString(), '7[7-9],[8-9]_,1__,2[0-3]_,24[0-4]');
    verify('split_to_patterns(4844190000, 4844192749)', split_to_patterns(4844190000, 4844192749).toString(),
        '484419[0-1]___,4844192[0-6]__,48441927[0-4]_');
    verify('split_to_patterns(10, 312)', split_to_patterns(10, 312).toString(), '[1-9]_,[1-2]__,30_,31[0-2]');
    verify('split_to_patterns(12, 3456)', split_to_patterns(12, 3456).toString(),
        '1[2-9],[2-9]_,[1-9]__,[1-2]___,3[0-3]__,34[0-4]_,345[0-6]');

    // test_quality 2

    verify_regex(1, 1, '1');
    verify_regex(0, 1, '0|1');
    verify_regex(0, 10, '_|10');
    verify_regex(0, 2, '0|1|2');
    verify_regex(65666, 65667, '65666|65667');
    verify_regex(1, 19, '1|2|3|4|5|6|7|8|9|1_');
    verify_regex(1, 99, '1|2|3|4|5|6|7|8|9|1_|2_|3_|4_|5_|6_|7_|8_|9_');
    verify_regex(102, 130, '102|103|104|105|106|107|108|109|11_|12_|130');
    // 10_,11_,12_,13_,14_,15_,16_,17_,18_,19_,200,201 -> 1__,200,201
    verify_regex(100, 201, '1__|200|201');
    verify_regex(77, 244, '77|78|79|8_|9_|1__|20_|21_|22_|23_|240|241|242|243|244');
    verify_regex(4844190000, 4844192749,
        '4844190___|4844191___|48441920__|48441921__|48441922__|48441923__|48441924__|48441925__|48441926__|484419270_|484419271_|484419272_|484419273_|484419274_');
    verify_regex(10, 312, '1_|2_|3_|4_|5_|6_|7_|8_|9_|1__|2__|30_|310|311|312');

    // test_equal

    verify_range(1, 1, 0, 100);
    verify_range(65443, 65443, 65000, 66000);
    verify_range(192, 1000, 0, 1000);
    verify_range(100019999300000, 100020000300000, 100019999300000, 100020000400000);
    // test_repeated_digit
    verify_range(10331, 20381, 0, 99999);
    // test_repeated_zeros
    verify_range(10031, 20081, 0, 99999);
    // test_zero_one
    verify_range(10301, 20101, 0, 99999);
    // test_different_len_numbers
    verify_range(1030, 20101, 0, 99999);
    // test_repetead_one
    verify_range(102, 111, 0, 1000);
    // test_small_diff_1
    verify_range(102, 110, 0, 1000);
    // test_small_diff_2
    verify_range(102, 130, 0, 1000);
    // test_random_range_1
    verify_range(4173, 7981, 0, 99999);
    // test_one_digit_numbers
    verify_range(3, 7, 0, 99);
    // test_one_digit_at_bounds
    verify_range(1, 9, 0, 1000);
    // test_power_of_ten
    verify_range(1000, 8632, 0, 99999);
    // test_different_len_numbers_2
    verify_range(13, 8632, 0, 10000);
    // test_different_len_numbers_small_diff
    verify_range(9, 11, 0, 100);
    // test_different_len_zero_eight_nine
    verify_range(90, 980099, 0, 999999);
    // test_small_diff
    verify_range(19, 21, 0, 100);
    // test_different_len_zero_one_nine
    verify_range(999, 10000, 1, 20000)

} // check()

/*****************************************************************************/

function main() {
    check();
} // main()

/*****************************************************************************/

main();

/*****************************************************************************/