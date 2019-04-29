/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2019, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

//import * as commonUtils from '../../../static/js/utils';
//import Mousetrap from 'mousetrap';

define([
  'sources/gettext', 'jquery', 'underscore', 'underscore.string', 'sources/pgadmin',
  'backbone', 'alertify', 'backform', 'backgrid', 'sources/browser/generate_url',
  'pgadmin.backform', 'pgadmin.backgrid',
  'pgadmin.browser.node', 'backgrid.select.all',
], function(gettext, $, _, S, pgAdmin, Backbone, Alertify, Backform, Backgrid, generateUrl) {

  var pgBrowser = pgAdmin.Browser = pgAdmin.Browser || {};

  // It has already been defined.
  // Avoid running this script again.
  if (pgBrowser.Collection)
    return pgBrowser.Collection;

  pgBrowser.Collection = function() {};

  _.extend(
    pgBrowser.Collection,
    _.clone(pgBrowser.Node), {
      ///////
      // Initialization function
      // Generally - used to register the menus for this type of node.
      //
      // Also, look at pgAdmin.Browser.add_menus(...) function.
      //
      // Collection will not have 'Properties' menu.
      //
      // NOTE: Override this for each node for initialization purpose
      Init: function() {
        if (this.node_initialized)
          return;
        this.node_initialized = true;
        pgAdmin.Browser.add_menus([{
          name: 'refresh', node: this.type, module: this,
          applies: ['object', 'context'], callback: 'refresh',
          priority: 1, label: gettext('Refresh...'),
          icon: 'fa fa-refresh',
        }]);

        // show query tool only in context menu of supported nodes.
        if (pgAdmin.DataGrid && pgAdmin.unsupported_nodes) {
          if (_.indexOf(pgAdmin.unsupported_nodes, this.type) == -1) {
            pgAdmin.Browser.add_menus([{
              name: 'show_query_tool', node: this.type, module: this,
              applies: ['context'], callback: 'show_query_tool',
              priority: 998, label: gettext('Query Tool...'),
              icon: 'fa fa-bolt',
            }]);
          }
        }
      },

      hasId: false,
      is_collection: true,
      collection_node: true,
      // A collection will always have a collection of statistics, when the node
      // it represent will have some statistics.
      hasCollectiveStatistics: true,
      canDrop: true,
      canDropCascade: true,
      showProperties: function(item, data, panel) {
        var that = this,
          j = panel.$container.find('.obj_properties').first(),
          view = j.data('obj-view'),
          content = $('<div></div>')
          .addClass('pg-prop-content col-12 has-pg-prop-btn-group'),
          node = pgBrowser.Nodes[that.node],
          // This will be the URL, used for object manipulation.
          urlBase = this.generate_url(item, 'properties', data),
          collection = new (node.Collection.extend({
            url: urlBase,
            model: node.model,
          }))(),
          info = this.getTreeNodeHierarchy.apply(this, [item]),
          gridSchema = Backform.generateGridColumnsFromModel(
            info, node.model, 'properties', that.columns
          ),
          createButtons = function(buttons, location, extraClasses) {
            // Arguments must be non-zero length array of type
            // object, which contains following attributes:
            // label, type, extraClasses, register
            if (buttons && _.isArray(buttons) && buttons.length > 0) {
              // All buttons will be created within a single
              // div area.
              var btnGroup =
                $('<div></div>').addClass(
                  'pg-prop-btn-group'
                ),
                // Template used for creating a button
                tmpl = _.template([
                  '<button type="<%= type %>" ',
                  'class="btn <%=extraClasses.join(\' \')%>"',
                  '<% if (disabled) { %> disabled="disabled"<% } %> title="<%-tooltip%>">',
                  '<span class="<%= icon %>"></span><% if (label != "") { %>&nbsp;<%-label%><% } %></button>',
                ].join(' '));
              if (location == 'header') {
                btnGroup.appendTo(that.header);
              } else {
                btnGroup.appendTo(that.footer);
              }
              if (extraClasses) {
                btnGroup.addClass(extraClasses);
              }
              _.each(buttons, function(btn) {
                // Create the actual button, and append to
                // the group div

                // icon may not present for this button
                if (!btn.icon) {
                  btn.icon = '';
                }
                var b = $(tmpl(btn));
                btnGroup.append(b);
                // Register is a callback to set callback
                // for certain operation for this button.
                btn.register(b);
              });
              return btnGroup;
            }
            return null;
          }.bind(panel);

        // Add the new column for the multi-select menus
        if((_.isFunction(that.canDrop) ?
              that.canDrop.apply(that, [data, item]) : that.canDrop) ||
              (_.isFunction(that.canDropCascade) ?
              that.canDropCascade.apply(that, [data, item]) : that.canDropCascade)) {
          gridSchema.columns.unshift({
            name: 'oid',
            cell: Backgrid.Extension.SelectRowCell.extend({
              initialize: function (options) {
                this.column = options.column;
                if (!(this.column instanceof Backgrid.Column)) {
                  this.column = new Backgrid.Column(this.column);
                }

                var column = this.column, model = this.model, $el = this.$el;
                this.listenTo(column, 'change:renderable', function (column, renderable) {
                  $el.toggleClass('renderable', renderable);
                });

                if (Backgrid.callByNeed(column.renderable(), column, model)) $el.addClass('renderable');

                this.listenTo(model, 'backgrid:select', this.toggleCheckbox);
              },
              toggleCheckbox: function(model, selected) {
                if (this.checkbox().prop('disabled') === false) {
                  this.checkbox().prop('checked', selected).change();
                }
              },
              render: function() {
                let model = this.model.toJSON();

                // canDrop can be set to false for individual row from the server side to disable the checkbox
                if ('canDrop' in model && model.canDrop === false)
                  this.$el.empty().append('<input tabindex="-1" type="checkbox" disabled="disabled"/>');
                else
                  this.$el.empty().append('<input tabindex="-1" type="checkbox" />');

                this.delegateEvents();
                return this;
              },
            }),
            headerCell: Backgrid.Extension.SelectAllHeaderCell,
          });
        }
          // Initialize a new Grid instance
        that.grid = new Backgrid.Grid({
          emptyText: 'No data found',
          columns: gridSchema.columns,
          collection: collection,
          className: 'backgrid table presentation table-bordered table-noouter-border table-hover',
        });

        var gridView = {
          'remove': function() {
            if (this.grid) {
              if (this.grid.collection) {
                this.grid.collection.reset({silent: true});
                delete (this.grid.collection);
              }
              delete (this.grid);
              this.grid = null;
            }
          },
          grid: that.grid,
        };

        if (view) {
          // Avoid unnecessary reloads
          if (_.isEqual($(panel).data('node-prop'), urlBase)) {
            return;
          }

          // Cache the current IDs for next time
          $(panel).data('node-prop', urlBase);

          // Reset the data object
          j.data('obj-view', null);
        }

        // Make sure the HTML element is empty.
        j.empty();
        j.data('obj-view', gridView);

        that.header = $('<div></div>').addClass(
            'pg-prop-header'
        ).appendTo(j);

         // Render the buttons
        var buttons = [];

        buttons.push({
          label: '',
          type: 'delete',
          tooltip: gettext('Delete/Drop'),
          extraClasses: ['btn-secondary m-1', 'delete_multiple'],
          icon: 'fa fa-lg fa-trash-o',
          disabled:  (_.isFunction(that.canDrop)) ? !(that.canDrop.apply(self, [data, item])) : (!that.canDrop),
          register: function(btn) {
            btn.on('click',() => {
              onDrop('drop');
            });
          },
        });

        buttons.push({
          label: '',
          type: 'delete',
          tooltip: gettext('Drop Cascade'),
          extraClasses: ['btn-secondary m-1', 'delete_multiple_cascade'],
          icon: 'icon-delete_multiple_cascade',
          disabled: (_.isFunction(that.canDropCascade)) ? !(that.canDropCascade.apply(self, [data, item])) : (!that.canDropCascade),
          register: function(btn) {
            btn.on('click',() => {
              onDrop('dropCascade');
            });
          },
        });

        createButtons(buttons, 'header', 'pg-prop-btn-group-above');

        // Render subNode grid
        content.append('<div class="pg-prop-coll-container"></div>');
        content.find('.pg-prop-coll-container').append(that.grid.render().$el);
        j.append(content);

        // Fetch Data
        collection.fetch({
          reset: true,
          error: function(model, error, xhr) {
            pgBrowser.Events.trigger(
              'pgadmin:collection:retrieval:error', 'properties', xhr, error,
              error.message, item, that
            );
            if (!Alertify.pgHandleItemError(
              xhr, error, error.message, {item: item, info: info}
            )) {
              Alertify.pgNotifier(error, xhr, S(
                gettext('Error retrieving properties - %s.')
              ).sprintf(error.message || that.label).value(), function() {
                console.warn(arguments);
              });
            }
          },
        });

        var onDrop = function(type) {
          let sel_row_models = this.grid.getSelectedModels(),
            sel_rows = [],
            item = pgBrowser.tree.selected(),
            d = item ? pgBrowser.tree.itemData(item) : null,
            node = pgBrowser.Nodes[d._type],
            url = undefined,
            msg = undefined,
            title = undefined;

          _.each(sel_row_models, function(r){ sel_rows.push(r.id); });

          if (sel_rows.length === 0) {
            Alertify.alert(gettext('Drop Multiple'),
              gettext('Please select at least one object to delete.')
            );
            return;
          }

          if (type === 'dropCascade') {
            url = node.generate_url(item, 'delete'),
            msg = gettext('Are you sure you want to drop all the selected objects and all the objects that depend on them?'),
            title = gettext('DROP CASCADE multiple objects?');
          } else {
            url = node.generate_url(item, 'drop');
            msg = gettext('Are you sure you want to drop all the selected objects?');
            title = gettext('DROP multiple objects?');
          }


          Alertify.confirm(title, msg,
            function() {
              $.ajax({
                url: url,
                type: 'DELETE',
                data: JSON.stringify({'ids': sel_rows}),
                contentType: 'application/json; charset=utf-8',
              })
              .done(function(res) {
                if (res.success == 0) {
                  pgBrowser.report_error(res.errormsg, res.info);
                } else {
                  $(pgBrowser.panels['properties'].panel).removeData('node-prop');
                  pgBrowser.Events.trigger(
                  'pgadmin:browser:tree:refresh', item || pgBrowser.tree.selected(), {
                    success: function() {
                      node.callbacks.selected.apply(node, [item]);
                    },
                  });
                }
                return true;
              })
              .fail(function(jqx) {
                var msg = jqx.responseText;
                /* Error from the server */
                if (jqx.status == 417 || jqx.status == 410 || jqx.status == 500) {
                  try {
                    var data = JSON.parse(jqx.responseText);
                    msg = data.errormsg;
                  } catch (e) {
                    console.warn(e.stack || e);
                  }
                }
                pgBrowser.report_error(
                  S(gettext('Error dropping %s'))
                  .sprintf(d._label.toLowerCase())
                  .value(), msg);

                $(pgBrowser.panels['properties'].panel).removeData('node-prop');
                pgBrowser.Events.trigger(
                  'pgadmin:browser:tree:refresh', item || pgBrowser.tree.selected(), {
                    success: function() {
                      node.callbacks.selected.apply(node, [item]);
                    },
                  }
                );
              });
            },
            null).show();
          return;
        }.bind(that);
      },
      generate_url: function(item, type) {
        /*
         * Using list, and collection functions of a node to get the nodes
         * under the collection, and properties of the collection respectively.
         */
        var opURL = {
            'properties': 'obj',
            'children': 'nodes',
            'drop': 'obj',
          },
          self = this;
        var collectionPickFunction = function (treeInfoValue, treeInfoKey) {
          return (treeInfoKey != self.type);
        };
        var treeInfo = this.getTreeNodeHierarchy(item);
        var actionType = type in opURL ? opURL[type] : type;
        return generateUrl.generate_url(
          pgAdmin.Browser.URL, treeInfo, actionType, self.node,
          collectionPickFunction
        );
      },
    });

  return pgBrowser.Collection;
});
