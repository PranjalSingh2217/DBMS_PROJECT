/* Campus Finder - page behaviour for Report, Search, My Claims and Matches.
 * Needs js/data.js (sample rows + mode) and js/match.js (scoring) loaded first.
 *
 * Mode (window.CF_MODE, set in js/data.js):
 *   'demo'  reports and claims are kept in this browser, so the whole flow
 *           (report -> matches -> search -> claim -> my claims) works without a server.
 *   'live'  the report form posts to ReportItemServlet as written in the HTML.
 *
 * Everything that comes from data is passed through esc() before it is put into
 * the page, so the same code stays safe when the data comes from a servlet.
 */
(function () {
    'use strict';

    var D = window.CF;
    var M = window.CFMatch;
    if (!D) { return; }

    var DEMO = window.CF_MODE !== 'live';

    var KEY_USER = 'cf_user';
    var KEY_CLAIMS = 'cf_claims';
    var KEY_ITEMS = 'cf_items';

    /* ---------- small helpers ---------- */

    function $(sel, root) { return (root || document).querySelector(sel); }

    function esc(value) {
        return String(value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function readStore(key, fallback) {
        try {
            var raw = window.localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) { return fallback; }
    }

    function writeStore(key, value) {
        try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stays in memory only */ }
    }

    function removeStore(key) {
        try { window.localStorage.removeItem(key); } catch (e) { /* nothing to remove */ }
    }

    function indexBy(list, key) {
        var map = {};
        list.forEach(function (row) { map[row[key]] = row; });
        return map;
    }

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function fmtDate(iso) {
        var p = iso.split('-');
        return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
    }

    function todayIso() {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }

    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    /* ---------- state ---------- */

    var students = indexBy(D.students, 'student_id');
    var categories = indexBy(D.categories, 'category_id');
    var locations = indexBy(D.locations, 'location_id');

    var extraItems = DEMO ? readStore(KEY_ITEMS, []) : [];
    var extraClaims = readStore(KEY_CLAIMS, []);
    var userId = Number(readStore(KEY_USER, 5005));
    if (!students[userId]) { userId = D.students[0].student_id; }

    function allItems() { return D.items.concat(extraItems); }
    function allClaims() { return D.claims.concat(extraClaims); }
    function itemById(id) { return allItems().filter(function (i) { return i.item_id === id; })[0]; }
    function currentStudent() { return students[userId]; }

    /* ---------- header: who is looking ---------- */

    function initWho() {
        var host = $('[data-who]');
        if (!host) { return; }
        host.innerHTML = '<label for="who-select">Viewing as</label><select id="who-select">' +
            D.students.map(function (s) {
                return '<option value="' + s.student_id + '"' + (s.student_id === userId ? ' selected' : '') + '>' +
                    esc(s.student_name) + '</option>';
            }).join('') + '</select>';
        $('#who-select').addEventListener('change', function (e) {
            userId = Number(e.target.value);
            writeStore(KEY_USER, userId);
            document.dispatchEvent(new Event('cf:user'));
        });
    }

    /* ---------- toast ---------- */

    var toastTimer;
    function toast(message) {
        var el = $('#toast');
        if (!el) { return; }
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 4500);
    }

    function stamp(status) {
        return '<span class="stamp stamp--' + esc(status.toLowerCase()) + '">' + esc(status) + '</span>';
    }

    function fillOptions(select, rows, valueKey, labelKey) {
        select.insertAdjacentHTML('beforeend', rows.map(function (r) {
            return '<option value="' + esc(r[valueKey]) + '">' + esc(r[labelKey]) + '</option>';
        }).join(''));
    }

    /* ---------- Report ---------- */

    function initReport() {
        var form = $('#report-form');
        var types = form.elements['item_status'];
        var nameInput = $('#itemName');
        var dateInput = $('#reportedDate');
        var dateLabel = $('#date-label');
        var locationLabel = $('#location-label');
        var submitBtn = $('#submit-btn');
        var submitLabel = submitBtn.querySelector('.btn-label');
        var saved = $('#saved');

        var copy = {
            LOST:  { date: 'Date lost',  location: 'Where did you last see it?', submit: 'Submit Lost Report' },
            FOUND: { date: 'Date found', location: 'Where did you find it?',     submit: 'Submit Found Report' }
        };

        function sync() {
            var c = copy[types.value];
            if (!c) { return; }
            dateLabel.textContent = c.date;
            locationLabel.textContent = c.location;
            submitLabel.textContent = c.submit;
        }

        function resetButton() {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            sync();
        }

        // Home page buttons link here with ?type=lost or ?type=found
        var wanted = (new URLSearchParams(window.location.search).get('type') || '').toUpperCase();
        Array.prototype.forEach.call(types, function (radio) {
            if (radio.value === wanted) { radio.checked = true; }
        });

        dateInput.max = todayIso();
        if (!dateInput.value) { dateInput.value = todayIso(); }

        form.addEventListener('change', function (e) {
            if (e.target.name === 'item_status') { sync(); }
        });
        nameInput.addEventListener('input', function () { nameInput.setCustomValidity(''); });

        form.addEventListener('submit', function (e) {
            if (!DEMO) {
                // live: let the form post to the servlet, but stop double submissions
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-busy', 'true');
                submitLabel.textContent = 'Submitting...';
                return;
            }

            e.preventDefault();
            var name = nameInput.value.trim();
            if (!name) {
                nameInput.setCustomValidity('Give the item a name.');
                nameInput.reportValidity();
                return;
            }

            var nextId = Math.max.apply(null, allItems().map(function (i) { return i.item_id; })) + 1;
            var item = {
                item_id: nextId,
                student_id: userId,
                category_id: Number(form.elements['category_id'].value),
                location_id: Number(form.elements['location_id'].value),
                item_name: name,
                description: form.elements['description'].value.trim(),
                item_status: types.value,
                reported_date: dateInput.value
            };
            extraItems.push(item);
            writeStore(KEY_ITEMS, extraItems);
            showSaved(item);
        });

        function showSaved(item) {
            var isLost = item.item_status === 'LOST';
            $('#saved-facts').innerHTML =
                '<div><dt>Report</dt><dd>No. ' + esc(item.item_id) + ' ' + stamp(item.item_status) + '</dd></div>' +
                '<div><dt>Item</dt><dd>' + esc(item.item_name) + '</dd></div>' +
                '<div><dt>Category</dt><dd>' + esc(categories[item.category_id].category_name) + '</dd></div>' +
                '<div><dt>' + (isLost ? 'Last seen' : 'Found at') + '</dt><dd>' + esc(locations[item.location_id].location_name) + '</dd></div>' +
                '<div><dt>Date</dt><dd>' + fmtDate(item.reported_date) + '</dd></div>' +
                '<div><dt>Reported by</dt><dd>' + esc(currentStudent().student_name) + '</dd></div>';
            $('#saved-primary').setAttribute('href', 'matches.html?' + (isLost ? 'scope=mine&min=30' : 'min=30'));
            form.hidden = true;
            saved.hidden = false;
            saved.focus();
        }

        $('#saved-again').addEventListener('click', function () {
            form.reset();
            dateInput.value = todayIso();
            saved.hidden = true;
            form.hidden = false;
            resetButton();
            nameInput.focus();
        });

        // Coming back with the Back button should not leave the button disabled
        window.addEventListener('pageshow', function (e) { if (e.persisted) { resetButton(); } });

        var note = $('#demo-note');
        if (note) { note.hidden = !DEMO; }

        sync();
    }

    /* ---------- Search ---------- */

    function initSearch() {
        var fStatus = $('#f-status');
        var fCategory = $('#f-category');
        var fLocation = $('#f-location');
        var list = $('#results');
        var count = $('#count');
        var form = $('#filters');
        var dialog = $('#claim-dialog');
        var claimForm = $('#claim-form');
        var claimText = $('#claim-text');
        var target = null;

        fillOptions(fCategory, D.categories, 'category_id', 'category_name');
        fillOptions(fLocation, D.locations, 'location_id', 'location_name');

        function claimsOn(itemId) {
            return allClaims().filter(function (c) { return c.item_id === itemId; });
        }

        function footer(it) {
            var mine = claimsOn(it.item_id).filter(function (c) { return c.student_id === userId; })[0];
            if (it.item_status === 'LOST') {
                return '<span>Lost report</span><a class="textlink" href="matches.html">Check matches</a>';
            }
            if (it.student_id === userId) { return '<span>You reported this</span>'; }
            if (mine) { return '<span>You claimed this</span>' + stamp(mine.claim_status); }
            var n = claimsOn(it.item_id).length;
            return '<span>' + (n ? plural(n, 'claim', 'claims') : 'No claims yet') + '</span>' +
                '<button type="button" class="btn btn-ink btn-small" data-claim="' + esc(it.item_id) + '">Claim this item</button>';
        }

        function ticket(it) {
            return '<li class="ticket">' +
                '<div class="ticket-top"><span class="tno">No. ' + esc(it.item_id) + '</span>' + stamp(it.item_status) + '</div>' +
                '<h3>' + esc(it.item_name) + '</h3>' +
                '<dl class="facts">' +
                    '<div><dt>Category</dt><dd>' + esc(categories[it.category_id].category_name) + '</dd></div>' +
                    '<div><dt>Location</dt><dd>' + esc(locations[it.location_id].location_name) + '</dd></div>' +
                    '<div><dt>Reported</dt><dd>' + fmtDate(it.reported_date) + '</dd></div>' +
                '</dl>' +
                '<p class="desc">' + esc(it.description || '') + '</p>' +
                '<div class="ticket-foot">' + footer(it) + '</div></li>';
        }

        function render() {
            var rows = allItems().filter(function (it) {
                return (!fStatus.value || it.item_status === fStatus.value) &&
                    (!fCategory.value || String(it.category_id) === fCategory.value) &&
                    (!fLocation.value || String(it.location_id) === fLocation.value);
            }).sort(function (a, b) {
                return b.reported_date.localeCompare(a.reported_date) || b.item_id - a.item_id;
            });

            count.textContent = plural(rows.length, 'item', 'items') + ' found';
            list.innerHTML = rows.length ? rows.map(ticket).join('') :
                '<li class="empty"><strong>Nothing matches those filters</strong>' +
                '<p>Try a different category or location, or clear the filters to see every report.</p>' +
                '<button type="button" class="btn btn-line" data-reset>Clear filters</button></li>';
        }

        form.addEventListener('change', render);
        form.addEventListener('reset', function () { setTimeout(render, 0); });
        form.addEventListener('submit', function (e) { e.preventDefault(); });

        list.addEventListener('click', function (e) {
            var reset = e.target.closest('[data-reset]');
            if (reset) { form.reset(); return; }
            var btn = e.target.closest('[data-claim]');
            if (!btn) { return; }
            target = itemById(Number(btn.getAttribute('data-claim')));
            $('#claim-title').textContent = 'Claim ' + target.item_name;
            $('#claim-sub').textContent = 'No. ' + target.item_id + ' · claiming as ' + currentStudent().student_name;
            claimText.value = '';
            claimText.setCustomValidity('');
            dialog.showModal();
            claimText.focus();
        });

        claimText.addEventListener('input', function () { claimText.setCustomValidity(''); });
        $('#claim-cancel').addEventListener('click', function () { dialog.close(); });

        claimForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = claimText.value.trim();
            if (!text) {
                claimText.setCustomValidity('Describe how you can show this item is yours.');
                claimText.reportValidity();
                return;
            }
            var duplicate = allClaims().some(function (c) { return c.item_id === target.item_id && c.student_id === userId; });
            dialog.close();
            if (duplicate) { toast('You have already claimed this item.'); return; }
            extraClaims.push({
                item_id: target.item_id, student_id: userId, claim_date: todayIso(),
                claim_description: text, claim_status: 'PENDING'
            });
            writeStore(KEY_CLAIMS, extraClaims);
            render();
            toast('Claim sent. It shows as pending under My Claims.');
        });

        document.addEventListener('cf:user', render);
        render();
    }

    /* ---------- My Claims ---------- */

    function initClaims() {
        var body = $('#claims-body');
        var table = $('#claims-table');
        var empty = $('#claims-empty');

        function render() {
            var me = currentStudent();
            $('#claims-who').textContent = me.student_name;

            var rows = allClaims().filter(function (c) { return c.student_id === userId; }).sort(function (a, b) {
                return b.claim_date.localeCompare(a.claim_date) || b.item_id - a.item_id;
            });

            ['PENDING', 'APPROVED', 'REJECTED'].forEach(function (s) {
                $('#stat-' + s.toLowerCase()).textContent = rows.filter(function (c) { return c.claim_status === s; }).length;
            });

            table.hidden = !rows.length;
            empty.hidden = rows.length > 0;

            body.innerHTML = rows.map(function (c) {
                var it = itemById(c.item_id);
                return '<tr>' +
                    '<td data-label="Item"><div><span class="item">' + esc(it.item_name) + '</span> <span class="idno">No. ' + esc(it.item_id) + '</span>' +
                        '<span class="note">“' + esc(c.claim_description || '') + '”</span></div></td>' +
                    '<td data-label="Category">' + esc(categories[it.category_id].category_name) + '</td>' +
                    '<td data-label="Location">' + esc(locations[it.location_id].location_name) + '</td>' +
                    '<td data-label="Claimed on">' + fmtDate(c.claim_date) + '</td>' +
                    '<td data-label="Status">' + stamp(c.claim_status) + '</td></tr>';
            }).join('');
        }

        document.addEventListener('cf:user', render);
        render();
    }

    /* ---------- Matches ---------- */

    function initMatches() {
        var scope = $('#m-scope');
        var min = $('#m-min');
        var list = $('#slips');
        var count = $('#count');

        // Links from the report page can preset the filters: ?scope=mine&min=30
        var params = new URLSearchParams(window.location.search);
        if (params.get('scope') === 'mine') { scope.value = 'mine'; }
        var wantedMin = params.get('min');
        if (wantedMin && Array.prototype.some.call(min.options, function (o) { return o.value === wantedMin; })) {
            min.value = wantedMin;
        }

        function tier(total) {
            return total >= 80 ? 'Very likely' : total >= 60 ? 'Likely' : total >= 40 ? 'Possible' : 'Weak';
        }

        function side(it, status) {
            return '<div class="side">' + stamp(status) +
                '<strong>' + esc(it.item_name) + '</strong>' +
                '<span class="meta">No. ' + esc(it.item_id) + ' · ' + esc(students[it.student_id].student_name) +
                    ' · ' + esc(locations[it.location_id].location_name) + ' · ' + fmtDate(it.reported_date) + '</span></div>';
        }

        function slip(m) {
            return '<li class="slip">' +
                '<div class="slip-score' + (m.total >= 80 ? ' strong' : '') + '"><b>' + m.total + '</b><small>/ 100</small>' +
                    '<span class="tier">' + tier(m.total) + '</span></div>' +
                '<div class="slip-body">' +
                    '<div class="pair">' + side(m.lost, 'LOST') + '<span class="swap" aria-hidden="true">⇄</span>' + side(m.found, 'FOUND') + '</div>' +
                    '<ul class="checks" aria-label="Score breakdown">' + m.parts.map(function (p) {
                        return '<li class="' + (p.hit ? 'hit' : 'miss') + '"><b>' + (p.hit ? '+' + p.pts : '+0') + '</b> ' + esc(p.label) + '</li>';
                    }).join('') + '</ul></div></li>';
        }

        function render() {
            var rows = M.pairs(allItems(), {
                minScore: Number(min.value),
                studentId: scope.value === 'mine' ? userId : null
            });
            count.textContent = plural(rows.length, 'possible match', 'possible matches') + ' scoring ' + min.value + ' or more';
            list.innerHTML = rows.length ? rows.map(slip).join('') :
                '<li class="empty"><strong>No matches at this score</strong>' +
                '<p>' + (scope.value === 'mine'
                    ? esc(currentStudent().student_name) + ' has no lost report that scores this high against a found one.'
                    : 'No lost and found pair scores this high.') +
                ' Lower the minimum score to see weaker matches.</p></li>';
        }

        scope.addEventListener('change', render);
        min.addEventListener('change', render);
        document.addEventListener('cf:user', render);
        render();
    }

    /* ---------- boot ---------- */

    initWho();

    var resetBtn = $('#reset-demo');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            removeStore(KEY_CLAIMS);
            removeStore(KEY_ITEMS);
            removeStore(KEY_USER);
            window.location.reload();
        });
    }

    var page = document.body.getAttribute('data-page');
    if (page === 'report') { initReport(); }
    if (page === 'search') { initSearch(); }
    if (page === 'claims') { initClaims(); }
    if (page === 'matches') { initMatches(); }
})();
