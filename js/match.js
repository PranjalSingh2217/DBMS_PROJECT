/* Possible-match scoring - the same rule as the SQL match finder.
 *
 *   same category            +30
 *   same location            +30
 *   reported within 3 days   +20
 *   description contains the found item's name (any case)   +20
 *                                                      max   100
 */
(function (root) {
    'use strict';

    var DAY = 86400000;

    function daysApart(a, b) {
        return Math.abs(Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / DAY;
    }

    function score(lost, found) {
        var parts = [
            { key: 'category', label: 'Same category',     pts: 30, hit: lost.category_id === found.category_id },
            { key: 'location', label: 'Same location',     pts: 30, hit: lost.location_id === found.location_id },
            { key: 'date',     label: 'Within 3 days',     pts: 20, hit: daysApart(lost.reported_date, found.reported_date) <= 3 },
            { key: 'keyword',  label: 'Name in description', pts: 20,
              hit: (lost.description || '').toUpperCase().indexOf((found.item_name || '').toUpperCase()) !== -1 }
        ];
        var total = 0;
        parts.forEach(function (p) { if (p.hit) { total += p.pts; } });
        return { total: total, parts: parts };
    }

    /* Every LOST item paired with every FOUND item.
       opts.minScore   keep pairs scoring at least this much (default 0)
       opts.studentId  only lost items reported by this student
       opts.excludeOwn skip pairs where one student reported both (default true) */
    function pairs(items, opts) {
        opts = opts || {};
        var min = opts.minScore || 0;
        var excludeOwn = opts.excludeOwn !== false;
        var lost = items.filter(function (i) {
            return i.item_status === 'LOST' && (opts.studentId == null || i.student_id === opts.studentId);
        });
        var found = items.filter(function (i) { return i.item_status === 'FOUND'; });
        var out = [];
        lost.forEach(function (l) {
            found.forEach(function (f) {
                if (excludeOwn && l.student_id === f.student_id) { return; }
                var s = score(l, f);
                if (s.total >= min) { out.push({ lost: l, found: f, total: s.total, parts: s.parts }); }
            });
        });
        out.sort(function (a, b) {
            return b.total - a.total || a.lost.item_id - b.lost.item_id || a.found.item_id - b.found.item_id;
        });
        return out;
    }

    root.CFMatch = { score: score, pairs: pairs };
    if (typeof module !== 'undefined' && module.exports) { module.exports = root.CFMatch; }
})(typeof window !== 'undefined' ? window : globalThis);
