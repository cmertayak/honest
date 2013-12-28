(function() {
    var APP_KEY = 'fm7a8oklxszyoqt';
    var client = new Dropbox.Client({key: APP_KEY}); 
    
    var utilities = {
        lastUpload: null,
        generateMainFolderName: function() {
            var currentDate = new Date();
            return currentDate.getFullYear()+'-'+(currentDate.getMonth()+1);
        },
        generateSubFolderName: function() {
            var currentDate = new Date();
            return currentDate.getDate();
        },
        generateFullFolderPath: function() {
            return this.generateMainFolderName()+'/'+this.generateSubFolderName();
        },
        generateFileName: function() {
            var currentDate = new Date();
            return currentDate.getHours()+'-'+currentDate.getMinutes()+'-'+currentDate.getSeconds()+'.jpg';
        },
        uploadImage: function(type, imageFile) {
            var folderName = this.generateFullFolderPath();
            var fileName = this.generateFileName();
            var fullPath = type+'/'+folderName+'/'+fileName;
            this.lastUpload = fullPath;
            client.writeFile(fullPath, imageFile, {}, function() {
                utilities.setLastUploadThumb();
            });
        },
        // filename: either full path 
        // or just file name
        getHourFromFileName: function(filename) {
            var arr = filename.split('/');
            var len = arr.length;
            filename = arr[len-1];
            var arr = filename.split('-');
            return arr[0];
        },
        setThumbImage: function(url, filename) {
            var $img = $('<img src="'+url+'">');
            var hour = this.getHourFromFileName(filename);
            $('#calendar .h'+hour).append($img);
        },
        setLastUploadThumb: function() {
            if(!this.lastUpload) {
                return;
            }
            var url = client.thumbnailUrl(this.lastUpload, {png:true});
            this.setThumbImage(url, this.lastUpload);
            this.lastUpload = null;
        },
        getTodaysThumbs: function(type) {
            var directoryPath = type+'/'+this.generateFullFolderPath();
            
            var that = this;
            
            client.readdir(directoryPath, {}, function(err, files) {
                if(err) {
                    return;
                }
                files.forEach(function(file) {
                    var filePath = directoryPath+'/'+file;
                    var url = client.thumbnailUrl(filePath, {png:true});
                    that.setThumbImage(url, file);
                });
            });
        },
        setTodaysDate: function() {
            var currentDate = new Date();
            $('.date').text(
                (currentDate.getMonth()+1)
                +'/'+currentDate.getDate()
                +'/'+currentDate.getFullYear()
            );
        }
    };
    
    $('.js-connect-btn').on('click', function() {
        client.authenticate(); 
    });
    
    // Try to finish OAuth authorization.
    client.authenticate({interactive: false}, function (error) {
        if (error) {
            alert('Authentication error: ' + error);
        }
    });
    
    if (client.isAuthenticated()) {
        $('.js-connect-btn').hide();
        var $fileUploader = $('#js-photo-upload');
        
        $('#js-photo-upload-btn').on('click', function(e) {
            $fileUploader.trigger('click');
        });
        
        $('#js-photo-upload').on('change', function(e) {
            var imgName = this.value;
            utilities.uploadImage('food', e.target.files[0]);
        });
        
        utilities.getTodaysThumbs('food');
        utilities.setTodaysDate();
    } else {
        console.log('not connected');
    }
})();