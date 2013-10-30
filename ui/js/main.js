(function ($) {

    // Backbone models

    var SelectionBoxItemModel = Backbone.Model.extend({});


    // Backbone collections

    var SelectionBoxCollection = Backbone.Collection.extend({
        model: SelectionBoxItemModel
    });


    // Backbone views

    var ListItemView = Backbone.View.extend({

        tagName: "option",
        template: _.template($("#list-item-template").html()),

        initialize: function() {
            // Add a reference to this view to the model related with it
            // We'll need it later to clean up old views
            this.model.set({view: this});

            // Add id attribute to the element referenced in this view
            this.$el.attr("id", this.model.get("id"));
        },

        render: function() {
            // It would have been easier given how simple is the template to just
            // render the value directly avoiding this at all
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
    });

    var AppView = Backbone.View.extend({

        el: $("#app"),
        
        initialize: function(options) {
            this.data = options.data;        // Data extracted from jsonp
            this.shows = options.shows;      // Shows collection
            this.regions = options.regions;  // Regions collection

            // Create simple object to reference which shows are available in which regions
            var appView = this;
            this.regionsPerShow = {};
            _.each(this.data["show_regions"], function(entry) {
                if (_.has(appView.regionsPerShow, entry["show_id"])) {
                    // Add the new region if the object already has a key for this show
                    appView.regionsPerShow[entry["show_id"]].push(entry["region_id"]);
                } else {
                    // No key for this show yet, create it with the first region inside
                    appView.regionsPerShow[entry["show_id"]] = [entry["region_id"]];
                }
            });

            // Cache some jQuery objects
            this.$showsList = this.$el.find("#showsList");
            this.$regionsList = this.$el.find("#regionsList");
            this.$status = this.$el.find("#status");

            // Bind actions to events taking place in collections "shows" and "regions" (only reset in both)
            this.listenTo(this.shows, "reset", this.refreshShows);
            this.listenTo(this.regions, "reset", this.refreshRegions);

            // Populate shows collection (will happen only once, when the app view is created the first time)
            this.shows.reset(this.data["shows"]);

            // Load previous state from localStorage
            this.readFromLocalStorage();
        },

        events: {
            "change #showsList"   : "showSelected",
            "change #regionsList" : "regionSelected",
            "click #goButton"     : "logResults",
        },

        refreshShows: function() {
            this.$showsList.append("<option selected disabled>Choose a show</option>");  

            var appView = this;
            this.shows.each(function (show) {
                var view = new ListItemView({model: show});
                appView.$showsList.append(view.render().el);
            });

            // Enable component and hide loading animation
            this.$showsList.removeAttr("disabled");
            $("#showsContainer .loading").hide();
        },

        refreshRegions: function() {
            this.$regionsList.append("<option selected disabled>Choose a region</option>");  

            var appView = this;
            this.regions.each(function (region) {
                var view = new ListItemView({model: region});
                appView.$regionsList.append(view.render().el);
            });

            // Enable component and hide loading animation
            this.$regionsList.removeAttr("disabled");
            $("#regionsContainer .loading").hide();

            // Make current list of regions persistent after refreshing
            if (this.validRegions !== undefined) {
                this.flushToLocalStorage("validRegions");
            }
        },

        showSelected: function() {
            // A show has been selected, now we need to update the regions collection including
            // only those in which the show is available

            // Make selected show persistent
            this.flushToLocalStorage("show");

            // Clean up previously created region views before reseting the collection
            this.regions.each(function (region) {
                if (region.has("view")) {
                    region.get("view").remove();
                }
            })
            this.$regionsList.html(""); // To remove placeholder option too

            // Display regions loading animation and disable component
            $("#regionsContainer .loading").show();
            this.$regionsList.attr("disabled");

            // Filter regions by show
            var appView = this;
            var selectedShow = this.$el.find("#showsList option:selected").attr("id");
            this.validRegions = _.clone(this.data["regions"]);
            this.validRegions = _.filter(this.validRegions, function(region) {
                return _.contains(appView.regionsPerShow[selectedShow], region["id"]);
            });

            // Reset the regions collection with valid regions according to current show selection
            setTimeout(function() {
                appView.regions.reset(appView.validRegions);
            }, 500); // Delayed intentionally to display loading some time
        },

        regionSelected: function() {
            // Make selected region persistent
            this.flushToLocalStorage("region");

            // Small animation to indicate the user what's the next step
            this.$el.find("#goButton").addClass("animated shake");
        },

        logResults: function() {
            var selectedShow = this.$el.find("#showsList option:selected");
            var selectedRegion = this.$el.find("#regionsList option:selected");

            // Display output in console log and status layer
            if (selectedShow.attr("id") === undefined || selectedRegion.attr("id") === undefined) {
                console.log("Please ensure you have selected a show and a region");
                this.updateStatus("Please ensure you have selected a show and a region");
            } else {
                console.log("Show selected: " + selectedShow.val() + " (" + selectedShow.attr("id") + ")");
                console.log("Region selected: " + selectedRegion.val() + " (" + selectedRegion.attr("id") + ")");
                this.updateStatus("We'll done! Please check your console log to check results..");
            }
        },

        updateStatus: function(msg) {
            this.$status.html(msg);
            this.$status.fadeIn().delay(2000).fadeOut();
        },

        flushToLocalStorage: function(whatToFlush) {
            // If localStorage is available in the browser, store selected options
            if (Modernizr.localstorage) {
                switch (whatToFlush) {
                    case "show":
                        var selectedShow = this.$el.find("#showsList option:selected").attr("id");
                        localStorage.setObject("selectedShow", selectedShow);
                        localStorage.removeItem("selectedRegion");
                        break;

                    case "region":
                        var selectedRegion = this.$el.find("#regionsList option:selected").attr("id");
                        localStorage.setObject("selectedRegion", selectedRegion);
                        break;

                    case "validRegions":
                        localStorage.setObject("validRegions", this.validRegions);
                        break;
                }
            } else {
                // Maybe fallback to cookies?
            }
        },

        readFromLocalStorage: function() {
            if (Modernizr.localstorage) {
                var selectedShow = localStorage.getObject("selectedShow");
                var selectedRegion = localStorage.getObject("selectedRegion");
                var validRegions = localStorage.getObject("validRegions");

                if (selectedShow && validRegions) {
                    // Mark as selected stored selectedShow
                    this.$el.find("#showsList").find("option[id=" + selectedShow + "]").attr("selected", true);

                    // Populate regions box with stored data
                    this.regions.reset(validRegions);

                    if (selectedRegion) {
                        // Mark as selected stored selectedShow
                        this.$el.find("#regionsList").find("option[id=" + selectedRegion + "]").attr("selected", true);
                    }
                }
            } else {
                // Maybe fallback to cookies?
            }
        },
    });


    // Thin wrapper to read/store objects (json serialized) in localstorage easily
    if (Modernizr.localstorage) {
        Storage.prototype.setObject = function(key, value) {
            this.setItem(key, JSON.stringify(value));
        }
        
        Storage.prototype.getObject = function(key) {
            return JSON.parse(this.getItem(key));
        }
    }


    // Process jsonp results once "downloaded"
    results = function (json) {
        // Create shows and regions collections
        var showsCollection = new SelectionBoxCollection();
        var regionsCollection = new SelectionBoxCollection();

        // Create app view (main view)
        var app = new AppView({
            data: json,
            shows: showsCollection,
            regions: regionsCollection
        });
    }


    // Load data file asynchronously when document is ready
    $(document).ready(function() {
        // Display "shows" loading animation
        $("#showsContainer .loading").show();

        setTimeout(function () {
            // First try to get data from local server
            var localServerReady = false;
            var request = $.getJSON("http://localhost:8001/api/data?callback=?")
            .then(function (data) {
                localServerReady = true;
                results(data);
            });

            // If local server is not available (after 200ms timeout), fallback to remote server
            setTimeout(function () {
                if (!localServerReady) {
                    console.log("Cannot load data from local server, using remote server copy.");
                    $("body").append("<script src='https://test-live-webapp.s3.amazonaws.com/json.js'></script>");
                    //$("body").append("<script src='data/json.js'></script>"); // Offline testing
                }
            }, 200);
        }, 800); // Delayed intentionally to display loading animation some time
    });

})(jQuery)
