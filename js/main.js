(function (Handlebars, Dropbox, $) {
    "use strict";
    
    var VIEW_MODE_TIMELINE = "view-mode-timeline",
        VIEW_MODE_IMAGE = "view-mode-image",
        DISPLAY_TYPE_FOOD = "food",
        
        APP_KEY = 'fm7a8oklxszyoqt',
        client = new Dropbox.Client({key: APP_KEY}),
        datastoreManager,
        notesTable,
        templates = {
            thumb: Handlebars.compile($('#tmpl-thumb').html()),
            originalImage: Handlebars.compile($('#tmpl-original-image').html())
        },
        $elements = {
            timeline: $('.js-timeline'),
            imageViewWrapper: $('.image-view-wrapper'),
            imageView: $('.image-view'),
            closeBtn: $('.js-close'),
            fileUploader: $('.js-photo-upload')
        },
        states = {
            displayType: DISPLAY_TYPE_FOOD,
            viewMode: VIEW_MODE_TIMELINE,
            lastUpload: null,
            viewDate: {},
            viewExtraData: {}
        },
        utilities = {
            _generateMainFolderName: function () {
                var currentDate = new Date();
                return currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1);
            },
            _generateSubFolderName: function () {
                var currentDate = new Date();
                return currentDate.getDate();
            },
            generateFullFolderPath: function () {
                return this._generateMainFolderName() + '/' + this._generateSubFolderName();
            },
            generateFileName: function () {
                var currentDate = new Date();
                return currentDate.getHours() + '-' +
                        currentDate.getMinutes() + '-' +
                        currentDate.getSeconds() + '.jpg';
            },
            generateFullPath: function (type) {
                var folderName = this.generateFullFolderPath(),
                    fileName = this.generateFileName();
                return type + '/' + folderName + '/' + fileName;
            },
            
            uploadImage: function (type, imageFile) {
                var fullPath = this.generateFullPath(type);
                states.lastUpload = fullPath;
                client.writeFile(fullPath, imageFile, {}, function () {
                    utilities.setLastUploadThumb();
                });
                this.closeImageView();
            },
            
            // filename: either full path
            // or just file name
            getHourFromFilePath: function (filepath) {
                var filename = this.getFileNameFromPath(filepath),
                    arr;
                arr = filename.split('-');
                return arr[0];
            },
            
            getTimeStringFromFilePath: function (filepath) {
                var filename = this.getFileNameFromPath(filepath),
                    arr;
                arr = filename.split('.');
                arr = arr[0].split('-');
                arr = arr.map($.proxy(this.addLeadingZeroForTwoDigits, this));
                return arr.join(':');
            },
            
            getDateTimeFromFilePath: function(filepath) {
                debugger;
            },
            
            getFileNameFromPath: function (filepath) {
                var arr = filepath.split('/');
                return arr[arr.length - 1];
            },
            
            setThumbImage: function (url, filepath) {
                var hour = this.getHourFromFilePath(filepath),
                    filename = this.getFileNameFromPath(filepath),
                    thumbnail = $(templates.thumb({src: url, 'filename': filename}));
                thumbnail.on('click', $.proxy(this.openOriginalImage, this));
                $('.h' + hour, $elements.timeline).append(thumbnail);
            },
                
            openOriginalImage: function (event) {
                var filename = $(event.target).data('filename'),
                    type = states.displayType,
                    directoryPath = type + '/' + this.generateFullFolderPath(),
                    bigImageSrc = client.thumbnailUrl(
                        directoryPath + '/' + filename, {size: 'l'}
                    ),
                    time = this.getTimeStringFromFilePath(filename);
                
                $elements.imageView.html(
                    templates.originalImage({'src': bigImageSrc, 'time': time})
                );
                this.openImageView();
                this.getDateTimeFromFilePath(filename);
            },
                
            setLastUploadThumb: function () {
                if (!states.lastUpload) {
                    return;
                }
                var url = client.thumbnailUrl(states.lastUpload, {png: true});
                this.setThumbImage(url, states.lastUpload);
                states.lastUpload = null;
            },
                
            getTodaysThumbs: function (type) {
                var directoryPath = type + '/' + this.generateFullFolderPath(),
                    that = this;
    
                client.readdir(directoryPath, {}, function (err, files) {
                    if (err) { return; }
                    files.forEach(function (file) {
                        var filePath = directoryPath + '/' + file,
                            url = client.thumbnailUrl(filePath, {png: true});
                        that.setThumbImage(url, file);
                    });
                });
            },
            
            addLeadingZeroForTwoDigits: function (number, numberOfDigits) {
                return ("0" + number).slice(-2);
            },
            
            setTodaysDate: function () {
                var currentDate = new Date();
                $('.js-date').text(
                    this.addLeadingZeroForTwoDigits(currentDate.getMonth() + 1) + '/' +
                        this.addLeadingZeroForTwoDigits(currentDate.getDate()) + '/' +
                        currentDate.getFullYear()
                );
            },
            
            openImageView: function () {
                if (states.viewMode === VIEW_MODE_IMAGE) {
                    return;
                }
                $elements.timeline.addClass('hidden');
                $elements.imageViewWrapper.removeClass('hidden');
                states.viewMode = VIEW_MODE_IMAGE;
            },
            
            closeImageView: function () {
                if (states.viewMode === VIEW_MODE_TIMELINE) {
                    return;
                }
                $elements.imageViewWrapper.addClass('hidden');
                $elements.timeline.removeClass('hidden');
                states.viewMode = VIEW_MODE_TIMELINE;
            },
            
            
            
            /*
            type & time
            time is an object consisting of (year, month, day, hour, minute, second)
            */
            fetchNote: function (type, time) {
            },
            
            _writeNote: function (notesTable, type, time, note) {
                notesTable.insert({
                    'type': type,
                    year: time.year,
                    month: time.month,
                    day: time.day,
                    hour: time.hour,
                    minute: time.minute,
                    second: time.second,
                    'note': note
                });
            },
            
            writeNoteForCurrentImage: function (note) {
            }
        };

    $('.js-connect-btn').on('click', function () {
        client.authenticate();
    });

    // Try to finish OAuth authorization.
    client.authenticate({interactive: false}, function (error) {
        if (error) {
            console.log('Authentication error: ' + error);
        }
        
        datastoreManager = client.getDatastoreManager();
        datastoreManager.openDefaultDatastore(function (error, datastore) {
            if (error) {
                alert('Error opening default datastore: ' + error);
            }
            notesTable = datastore.getTable('notes');
        });
    });

    if (client.isAuthenticated()) {
        $('.js-connect-btn').hide();

        $('.js-photo-upload-btn').on('click', function (e) {
            $elements.fileUploader.trigger('click');
        });

        $('.js-photo-upload').on('change', function (e) {
            var imgName = this.value;
            utilities.uploadImage(states.displayType, e.target.files[0]);
        });
        
        $('.content').on('click', '.js-save-note', function(e) {
            console.log('hee');
            utilities.writeNoteForCurrentImage($('.js-info-note').val());
        });
        
        $elements.closeBtn.on('click', function (e) {
            utilities.closeImageView();
        });
        
        utilities.getTodaysThumbs(states.displayType);
        utilities.setTodaysDate();
    } else {
        console.log('not connected');
    }
}(Handlebars, Dropbox, Zepto));