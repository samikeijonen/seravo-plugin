// phpcs:disable PEAR.Functions.FunctionCallSignature
'use strict';
// Generic ajax report loader function
jQuery(document).ready(function($) {

  function seravo_load_http_request_reports(){
    $.post(
      seravo_reports_loc.ajaxurl,
      { 'action': 'seravo_report_http_requests',
        'nonce': seravo_reports_loc.ajax_nonce, },
      function(rawData) {
        var data = JSON.parse(rawData);
        //test if this is still valid
        if (data.length == 0) {
          //echo '<tr><td colspan=3>' . seravo_reports.no_reports . '</td></tr>';
          jQuery('#http-requests_info').html(seravo_reports_loc.no_reports);
        } else {
          // take months separately

          //max value is in it's own little container
          var result = data.filter(function( obj ) {
            return obj.hasOwnProperty('max_requests');
          });
          var max_requests = result[0].max_requests;

          data.forEach( function(month) {
            if (month.hasOwnProperty('date')) {
              var bar_size = month.requests / max_requests;
              if ( bar_size <= 10 ) {
                var bar_css = 'auto';
              } else {
                var bar_css = bar_size + '%';
              }
              jQuery( '#http-reports_table' ).prepend('<tr><td><a href="?report=' +
              month.date +
              '.html" target="_blank"> ' +
              month.date +
              ' </a> </td> <td><div style="background: #44A1CB; color: #fff; padding: 3px; width: ' +
              bar_css +
              '; display: inline-block;">' +
              month.requests +
              '</div></td> <td><a href="?report=-' +
              month.date +
              '.html" target="_blank" class="button hideMobile">' +
              seravo_reports_loc.view_report +
              '<span aria-hidden="true" class="dashicons dashicons-external" style="line-height: unset; padding-left: 3px;"></span></a></td></tr>'
              );
            }

          });
        }
      }
    );
  }

  function seravo_load_cache_status_reports() {
    jQuery.post(seravo_reports_loc.ajaxurl, {
      'action': 'seravo_reports',
      'section': 'redis_info',
      'nonce': seravo_reports_loc.ajax_nonce,
    }, function(rawData) {
      if (rawData.length) {
        var data = JSON.parse(rawData);

        var keys = {
          'expired_keys': seravo_reports_loc.expired_keys,
          'evicted_keys': seravo_reports_loc.evicted_keys,
          'keyspace_hits': seravo_reports_loc.keyspace_hits,
          'keyspace_misses': seravo_reports_loc.keyspace_misses,
        };
        var values = {};
        
        var limit = data.length;
        for ( var i = 0; i < limit; i++ ) {
          var entry = data[i].split(':');
          if( entry.length && entry[0] in keys ) {
            data[i] = data[i].replace(entry[0], keys[entry[0]]);
            values[entry[0]] = entry[1];
          }
          data[i] = data[i].replace(':', ': ');
        }
        var hits = parseInt(values['keyspace_hits']);
        var misses = parseInt(values['keyspace_misses']);
        var hitRate = Math.round(hits / (hits + misses) * 10000) / 100 + '%';
        data.push(seravo_reports_loc.hit_rate + ': ' + hitRate);
        
        jQuery('.redis_info_loading').fadeOut();
        jQuery('#redis_info').text(data.join("\n"));
      } else {
        jQuery('#redis_info').html(seravo_reports.no_data);
      }
    }).fail(function() {
      jQuery('.redis_info_loading').html(seravo_reports.failed);
    });

    $('.test-cache-btn').click(function() {
      jQuery.post(seravo_reports_loc.ajaxurl, {
        'action': 'seravo_reports',
        'section': 'front_cache_status',
        'nonce': seravo_reports_loc.ajax_nonce,
      }, function(rawData) {
        if (rawData.length == 0) {
          jQuery('#front_cache_stats').html(seravo_reports.no_data);
        } else {
          var data = JSON.parse(rawData);
          jQuery('#front_cache_status').text(data['output'].join("\n"));
          jQuery('.front_cache_status_loading').fadeOut();
        }
      }).fail(function() {
        jQuery('.front_cache_status_loading').html(seravo_reports.failed);
      });
    }).click();
  }

  function seravo_load_report(section) {
    jQuery.post(seravo_reports_loc.ajaxurl, {
      'action': 'seravo_reports',
      'section': section,
      'nonce': seravo_reports_loc.ajax_nonce,
    }, function(rawData) {
      if (rawData.length == 0) {
        jQuery('#' + section).html(seravo_reports.no_data);
      }

      if (section === 'folders_chart') {
        var allData = JSON.parse(rawData);
        jQuery('#total_disk_usage').text(allData.data.human);
        generateChart(allData.dataFolders);
      } else {
        var data = JSON.parse(rawData);
        jQuery('#' + section).text(data.join("\n"));
      }
      jQuery('.' + section + '_loading').fadeOut();
    }).fail(function() {
      jQuery('.' + section + '_loading').html(seravo_reports.failed);
    });
  }
  seravo_load_http_request_reports();
  seravo_load_cache_status_reports();
  seravo_load_report('folders_chart');
  seravo_load_report('wp_core_verify');
  seravo_load_report('git_status');
  //seravo_load_report('redis_info');
});
