/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var bzapi = "https://api-dev.bugzilla.mozilla.org/latest/";
var product = "Boot2Gecko";
var bugs = {}, history;
var pending = 0;
var lates = [], allbugs = [], fixed = [], nonfixed = [];
var gdata = [];
$.getJSON(bzapi + "bug", {
    product:product,
    keywords: "late-l10n",
    include_fields: "id,resolution,last_change_time,creation_time," +
        "cf_last_resolved,cf_blocking_basecamp,summary"
}, onLoadBugs);

function onLoadBugs(data) {
    // sort newest first
    var j, jj, id, bug;
    data.bugs.sort(function(bl, br) {
        if (bl.last_change_time < br.last_change_time) {
            return 1;
        }
        if (bl.last_change_time > br.last_change_time) {
            return -1;
        }
        return 0;
    });
    for (j=0, jj=Math.min(100, data.bugs.length); j<jj; ++j) {
        bug = data.bugs[j];
        id = bug.id;
        bug.creation_time = new Date(bug.creation_time);
        bug.last_change_time = new Date(bug.last_change_time);
        if (bug.cf_last_resolved) {
            bug.cf_last_resolved = new Date(bug.cf_last_resolved.split(" ", 1));
        }
        if (bug.resolution==="") bug.resolution="OPEN";
        bugs[id] = data.bugs[j];
        $.getJSON(bzapi + 'bug/' + id + '/history',
                  processHistory(id));
    }
}
function processHistory(id) {
    ++pending;
    return function(data) {
        history = data.history;
        var j, jj, k, kk, changes, change;
        for (j=data.history.length - 1; j >= 0; --j) {
            changes = data.history[j].changes;
            for (k = changes.length - 1; k >= 0; --k) {
                change = changes[k];
                if (change.field_name == 'keywords' &&
                    change.added == 'late-l10n') {
                    bugs[id].late_l10n = new Date(data.history[j].change_time);
                    maybeDoTable(id);
                    return;
                }
            }
        }
        // we've had late-l10n from the start, use that
        bugs[id].late_l10n = bugs[id].creation_time;
        maybeDoTable(id);
    };
}

$(function () {
    $("#bugz").dataTable({
        "bJQueryUI": true,
        "bPaginate": false,
        "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
            var inner = $('<a></a>')
                .attr('href', 'https://bugzil.la/' + aData[0])
                .text(aData[0]);
            $('td:eq(0)', nRow).html(inner);
        }
    });
});

function maybeDoTable(id) {
    --pending;
    var tbl = [], bug = bugs[id];
    $("#bugz").dataTable()
        .fnAddData([bug.id, bug.summary, bug.resolution, bug.cf_last_resolved,
                    bug.creation_time, bug.late_l10n,
                    bug.cf_blocking_basecamp]);
    lates.push(bug.late_l10n);
    allbugs.push(bug.creation_time);
    gdata.push({date: bug.creation_time, event:'creation', id: id});
    gdata.push({date: bug.late_l10n, event:'l10n', id: id});
    if (bug.cf_last_resolved) {
        gdata.push({date: bug.cf_last_resolved, event:bug.resolution=="FIXED" ? "fixed" : "nonfixed", id: id});
        if (bug.resolution=="FIXED") {
            fixed.push(bug.cf_last_resolved);
        }
        else {
            nonfixed.push(bug.cf_last_resolved);
        }
    }
    if (pending <= 0) {
        doD3();
    }
}
