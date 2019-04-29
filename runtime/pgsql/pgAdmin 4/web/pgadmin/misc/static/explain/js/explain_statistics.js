/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2019, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import $ from 'jquery';
import Backbone from 'backbone';

// Backbone model for other statistics
let StatisticsModel = Backbone.Model.extend({
  defaults: {
    JIT: [],
    Triggers: [],
  },

  set_statistics: function(toolTipContainer) {
    var jit_stats = this.get('JIT'),
      triggers_stats = this.get('Triggers');

    if (Object.keys(jit_stats).length > 0 ||
        Object.keys(triggers_stats).length > 0) {
      $('.pg-explain-stats-area').removeClass('d-none');
    }

    $('.pg-explain-stats-area').on('mouseover', () => {
      // Empty the tooltip content if it has any and add new data
      toolTipContainer.empty();
      if (Object.keys(jit_stats).length == 0 &&
        Object.keys(triggers_stats).length == 0) {
        return;
      }

      var tooltip = $('<table></table>', {
        class: 'pgadmin-tooltip-table',
      }).appendTo(toolTipContainer);

      if (Object.keys(jit_stats).length > 0){
        tooltip.append('<tr><td class="label explain-tooltip">JIT:</td></tr>');
        _.each(jit_stats, function(value, key) {
          key = _.escape(key);
          value = _.escape(value);
          tooltip.append(`
            <tr>
              <td class="label explain-tooltip">  ${key}</td>
              <td class="label explain-tooltip-val">${value}</td>
            </tr>
          `);
        });
      }

      if (Object.keys(triggers_stats).length > 0){
        tooltip.append('<tr><td class="label explain-tooltip">Triggers:</td></tr>');
        _.each(triggers_stats, function(triggers, key_id) {
          if (triggers instanceof Object) {
            _.each(triggers, function(value, key) {
              if (key === 'Trigger Name') {
                key = _.escape(key);
                value = _.escape(value);
                tooltip.append(`
                  <tr>
                    <td class="label explain-tooltip">  ${key}</td>
                    <td class="label explain-tooltip-val">${value}</td>
                  </tr>
                `);
              } else {
                key = _.escape(key);
                value = _.escape(value);
                tooltip.append(`
                  <tr>
                    <td class="label explain-tooltip">    ${key}</td>
                    <td class="label explain-tooltip-val">${value}</td>
                  </tr>
                `);
              }
            });
          }
          else {
            key_id = _.escape(key_id);
            triggers = _.escape(triggers);
            tooltip.append(`
              <tr>
                <td class="label explain-tooltip">  ${key_id}</td>
                <td class="label explain-tooltip-val">${triggers}</td>
              </tr>
            `);
          }
        });
      }

      // Show toolTip at respective x,y coordinates
      toolTipContainer.css({
        'opacity': '0.8',
        'left': '',
        'right': '65px',
        'top': '15px',
      });

      $('.pgadmin-explain-tooltip').css('padding', '5px');
      $('.pgadmin-explain-tooltip').css('border', '1px solid white');
    });

    // Remove tooltip when mouse is out from node's area
    $('.pg-explain-stats-area').on('mouseout', () => {
      toolTipContainer.empty();
      toolTipContainer.css({
        'opacity': '0',
        'left': 0,
        'top': 0,
      });
    });
  },
});

module.exports = StatisticsModel;
