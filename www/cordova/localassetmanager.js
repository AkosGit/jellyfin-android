﻿(function () {

    function getLocalMediaSource(serverId, itemId) {

        var deferred = DeferredBuilder.Deferred();

        // android
        if (window.ApiClientBridge) {
            var json = ApiClientBridge.getLocalMediaSource(serverId, itemId);

            if (json) {
                deferred.resolveWith(null, [JSON.parse(json)]);
            }
            else {
                deferred.resolveWith(null, [null]);
            }
            return deferred.promise();
        }

        getLocalItem(itemId, serverId).done(function (localItem) {

            if (localItem && localItem.Item.MediaSources.length) {

                var mediaSource = localItem.Item.MediaSources[0];

                fileExists(mediaSource.Path).done(function (exists) {

                    if (exists) {
                        deferred.resolveWith(null, [mediaSource]);
                    }
                    else {
                        deferred.resolveWith(null, [null]);
                    }

                }).fail(getOnFail(deferred));
                return;
            }

            deferred.resolveWith(null, [null]);

        }).fail(getOnFail(deferred));
        return deferred.promise();
    }

    function getCameraPhotos() {
        var deferred = DeferredBuilder.Deferred();

        if (window.CameraRoll) {

            var photos = [];

            CameraRoll.getPhotos(function (result) {
                photos.push(result);
            });

            setTimeout(function () {

                // clone the array in case the callback is still getting called
                Logger.log('Found ' + photos.length + ' in camera roll');

                deferred.resolveWith(null, [photos]);

            }, 2000);

        } else {
            deferred.resolveWith(null, [[]]);
        }
        return deferred.promise();
    }

    var offlineUserDatabase;
    function getOfflineUserdb(callback) {

        if (offlineUserDatabase) {
            callback(offlineUserDatabase);
            return;
        }

        // Create/open database
        offlineUserDatabase = window.sqlitePlugin.openDatabase({ name: "offlineusers.db" });

        offlineUserDatabase.transaction(function (tx) {

            tx.executeSql('CREATE TABLE IF NOT EXISTS users (id text primary key, data text)');
            tx.executeSql('create index if not exists idx_users on users(id)');

            callback(offlineUserDatabase);
        });
    }

    function saveOfflineUser(user) {

        var deferred = DeferredBuilder.Deferred();

        getOfflineUserdb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("REPLACE INTO offlineusers (id, data) VALUES (?,?)", [user.Id, JSON.stringify(user)], function (tx, res) {

                    deferred.resolve();
                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    function deleteOfflineUser(id) {

        var deferred = DeferredBuilder.Deferred();

        getOfflineUserdb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("DELETE from offlineusers where id=?", [user.Id], function (tx, res) {

                    deferred.resolve();
                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    var offlineActionsDatabase;
    function getOfflineActionsDb(callback) {

        if (offlineActionsDatabase) {
            callback(offlineActionsDatabase);
            return;
        }

        // Create/open database
        offlineActionsDatabase = window.sqlitePlugin.openDatabase({ name: "offlineactions.db" });

        offlineActionsDatabase.transaction(function (tx) {

            tx.executeSql('CREATE TABLE IF NOT EXISTS offlineactions (Id text primary key, ServerId text not null, Json text not null)');
            tx.executeSql('create index if not exists idx_offlineactions on offlineactions(id)');

            callback(offlineActionsDatabase);
        });
    }

    function getOfflineActions(serverId) {

        var deferred = DeferredBuilder.Deferred();

        getOfflineActionsDb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("SELECT Json from offlineactions where ServerId=?", [serverId], function (tx, res) {

                    var actions = [];
                    for (var i = 0, length = res.rows.length; i < length; i++) {
                        actions.push(JSON.parse(res.rows.item(i).Json));
                    }

                    deferred.resolveWith(null, [actions]);

                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    function deleteOfflineActions(actions) {

        var ids = actions.map(function (a) { return "'" + a.Id + "'"; }).join(',');

        var deferred = DeferredBuilder.Deferred();

        getOfflineActionsDb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("DELETE from offlineactions where Id in (" + ids + ")", [], function (tx, res) {

                    deferred.resolve();

                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    var offlineItemsDatabase;
    function getOfflineItemsDb(callback) {

        if (offlineItemsDatabase) {
            callback(offlineItemsDatabase);
            return;
        }

        // Create/open database
        offlineItemsDatabase = window.sqlitePlugin.openDatabase({ name: "offlineitems.db" });

        offlineItemsDatabase.transaction(function (tx) {

            tx.executeSql('CREATE TABLE IF NOT EXISTS Items ( Id text primary key, ItemId text not null, ItemType text not null, MediaType text, ServerId text not null, LocalPath text not null, UserIdsWithAccess text, AlbumId text, AlbumName text, SeriesId text, SeriesName text, Json text not null)');
            tx.executeSql('create index if not exists idx_items on Items(Id)');

            tx.executeSql('CREATE TABLE IF NOT EXISTS AlbumArtists ( Id text not null, Name text not null, ItemId text not null)');
            tx.executeSql('create index if not exists idx_AlbumArtists on AlbumArtists(id)');

            callback(offlineItemsDatabase);
        });
    }

    function getServerItemIds(serverId) {

        var deferred = DeferredBuilder.Deferred();

        getOfflineItemsDb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("SELECT ItemId from Items where ServerId=?", [serverId], function (tx, res) {

                    var itemIds = [];
                    for (var i = 0, length = res.rows.length; i < length; i++) {
                        itemIds.push(res.rows.item(i).ItemId);
                    }

                    deferred.resolveWith(null, [itemIds]);

                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    function getLocalItem(itemId, serverId) {

        var deferred = DeferredBuilder.Deferred();

        getOfflineItemsDb(function (db) {

            db.transaction(function (tx) {

                tx.executeSql("SELECT Json from Items where itemId=? AND serverId=?", [itemId, serverId], function (tx, res) {

                    if (res.rows.length) {

                        var localItem = JSON.parse(res.rows.item(0).Json);

                        deferred.resolveWith(null, [localItem]);
                    }
                    else {
                        deferred.resolveWith(null, [null]);
                    }

                }, function (e) {
                    deferred.reject();
                });
            });
        });

        return deferred.promise();
    }

    function addOrUpdateLocalItem(item) {

        Logger.log('addOrUpdateLocalItem');

        var deferred = DeferredBuilder.Deferred();

        getOfflineItemsDb(function (db) {

            db.transaction(function (tx) {

                var libraryItem = item.Item || {};

                var values = [item.Id, item.ItemId, libraryItem.Type, libraryItem.MediaType, item.ServerId, item.LocalPath, (item.UserIdsWithAccess || []).join(','), libraryItem.AlbumId, libraryItem.AlbumName, libraryItem.SeriesId, libraryItem.SeriesName, JSON.stringify(item)];
                tx.executeSql("REPLACE INTO Items (Id, ItemId, ItemType, MediaType, ServerId, LocalPath, UserIdsWithAccess, AlbumId, AlbumName, SeriesId, SeriesName, Json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", values);
                deferred.resolve();
            });
        });

        return deferred.promise();
    }

    function removeLocalItem(itemId, serverId) {

        var deferred = DeferredBuilder.Deferred();

        getLocalItem(itemId, serverId).done(function (item) {

            getOfflineItemsDb(function (db) {

                db.transaction(function (tx) {

                    tx.executeSql("DELETE from Items where itemId=? AND serverId=?", [itemId, serverId]);

                    var files = item.AdditionalFiles || [];
                    files.push(item.LocalPath);

                    deleteFiles(files).done(function () {

                        deferred.resolve();

                    }).fail(getOnFail(deferred));

                });
            });

        }).fail(getOnFail(deferred));

        return deferred.promise();
    }

    function deleteFiles(files) {
        var deferred = DeferredBuilder.Deferred();
        deleteNextFile(files, 0, deferred);
        return deferred.promise();
    }

    function deleteNextFile(files, index, deferred) {

        if (index >= files.length) {
            deferred.resolve();
            return;
        }

        deleteFile(file).done(function () {
            deleteNextFile(files, index + 1, deferred);
        }).fail(function () {
            deleteNextFile(files, index + 1, deferred);
        });
    }

    function deleteFile(path) {

        var deferred = DeferredBuilder.Deferred();

        Logger.log('Deleting ' + path);
        resolveFile(path, function (fileEntry) {

            fileEntry.remove(function () {
                Logger.log('Deleted ' + path);
                deferred.resolve();
            }, function () {

                Logger.log('Error deleting ' + path);
                deferred.reject();
            });

        }, function () {

            Logger.log('Skipping deletion because file does not exist: ' + path);
            deferred.resolve();
        });

        return deferred.promise();
    }

    function resolveFile(path, success, fail) {

        getFileSystem().done(function (fileSystem) {

            fileSystem.root.getFile(path, { create: false }, success, fail);
        });
    }

    function createLocalItem(libraryItem, serverInfo, originalFileName) {

        var path = getDirectoryPath(libraryItem, serverInfo);
        path.push(getLocalFileName(libraryItem, originalFileName));

        var item = {};

        var deferred = DeferredBuilder.Deferred();

        var localPath = path.join('/');

        item.LocalPath = localPath;

        for (var i = 0, length = libraryItem.MediaSources.length; i < length; i++) {

            var mediaSource = libraryItem.MediaSources[i];
            mediaSource.Path = localPath;
            mediaSource.Protocol = 'File';
        }

        item.ServerId = serverInfo.Id;
        item.Item = libraryItem;
        item.ItemId = libraryItem.Id;
        item.Id = getLocalId(item.ServerId, item.ItemId);
        deferred.resolveWith(null, [item]);

        return deferred.promise();
    }

    function getDirectoryPath(item, server) {

        var parts = [];
        parts.push("sync");
        parts.push(server.Name);

        if (item.Type == "Episode") {
            parts.push("TV");
            parts.push(item.SeriesName);

            if (item.SeasonName) {
                parts.push(item.SeasonName);
            }
        }
        else if (item.MediaType == 'Video') {
            parts.push("Videos");
            parts.push(item.Name);
        }
        else if (item.MediaType == 'Audio') {
            parts.push("Music");

            if (item.AlbumArtist) {
                parts.push(item.AlbumArtist);
            }

            if (item.Album) {
                parts.push(item.Album);
            }
        }
        else if (item.MediaType == 'Photo') {
            parts.push("Photos");

            if (item.Album) {
                parts.push(item.Album);
            }
        }

        return parts.map(getValidFileName);
    }

    function getLocalFileName(libraryItem, originalFileName) {

        var filename = originalFileName || libraryItem.Name;

        return getValidFileName(filename);
    }

    function getValidFileName(filename) {
        // TODO
        return filename;
    }

    function downloadFile(url, localPath, enableBackground) {

        if (!enableBackground) {
            return downloadWithFileTransfer(url, localPath);
        }

        var deferred = DeferredBuilder.Deferred();

        if (localStorage.getItem('sync-' + url) == '1') {
            Logger.log('file was downloaded previously');
            deferred.resolveWith(null, [localPath]);
            return deferred.promise();
        }

        Logger.log('downloading: ' + url + ' to ' + localPath);

        getFileSystem().done(function (fileSystem) {

            createDirectory(getParentDirectoryPath(localPath)).done(function () {

                fileSystem.root.getFile(localPath, { create: true }, function (targetFile) {

                    var downloader = new BackgroundTransfer.BackgroundDownloader();
                    // Create a new download operation.
                    var download = downloader.createDownload(url, targetFile);

                    var isQueued = true;

                    // Start the download and persist the promise to be able to cancel the download.
                    var downloadPromise = download.startAsync().then(function () {

                        // on success
                        Logger.log('Downloaded local url: ' + localPath);
                        localStorage.setItem('sync-' + url, '1');
                        isQueued = false;

                    }, function () {

                        // on error
                        Logger.log('download failed: ' + url + ' to ' + localPath);
                        deferred.reject();

                    }, function (value) {

                        // on progress
                        //Logger.log('download progress: ' + value);
                    });

                    // Give it a short period of time to see if it has already been completed before. Either way, move on and resolve it.
                    setTimeout(function () {
                        // true indicates that it's queued
                        deferred.resolveWith(null, [localPath, isQueued]);
                    }, 1500);
                });

            }).fail(getOnFail(deferred));;

        }).fail(getOnFail(deferred));

        return deferred.promise();
    }

    function downloadWithFileTransfer(url, localPath) {

        var deferred = DeferredBuilder.Deferred();

        Logger.log('downloading: ' + url + ' to ' + localPath);

        getFileSystem().done(function (fileSystem) {

            createDirectory(getParentDirectoryPath(localPath)).done(function () {

                var path = fileSystem.root.toURL() + "/emby/cache/" + key;

                var ft = new FileTransfer();
                ft.download(url, path, function (entry) {

                    deferred.resolveWith(null, [localPath]);
                });

            }).fail(getOnFail(deferred));;

        }).fail(getOnFail(deferred));

        return deferred.promise();
    }

    function createDirectory(path) {

        var deferred = DeferredBuilder.Deferred();
        createDirectoryPart(path, 0, deferred);
        return deferred.promise();
    }

    function createDirectoryPart(path, index, deferred) {

        var parts = path.split('/');
        if (index >= parts.length) {
            deferred.resolve();
            return;
        }

        parts.length = index + 1;
        var pathToCreate = parts.join('/');

        createDirectoryInternal(pathToCreate).done(function () {

            createDirectoryPart(path, index + 1, deferred);

        }).fail(getOnFail(deferred));
    }

    function createDirectoryInternal(path) {

        Logger.log('creating directory: ' + path);
        var deferred = DeferredBuilder.Deferred();

        getFileSystem().done(function (fileSystem) {

            fileSystem.root.getDirectory(path, { create: true, exclusive: false }, function (targetFile) {

                Logger.log('createDirectory succeeded');
                deferred.resolve();

            }, function () {

                Logger.log('createDirectory failed');
                deferred.reject();
            });

        }).fail(getOnFail(deferred));

        return deferred.promise();
    }

    function downloadSubtitles(url, localItem, subtitleStream) {

        var path = item.LocalPath;

        var filename = getSubtitleSaveFileName(item, subtitleStream.Language, subtitleStream.IsForced) + "." + subtitleStream.Codec.toLowerCase();

        var parentPath = getParentDirectoryPath(path);

        path = combinePaths(parentPath, filename);

        return downloadFile(url, path);
    }

    function getSubtitleSaveFileName(item, language, isForced) {

        var path = item.LocalPath;

        var name = getNameWithoutExtension(path);

        if (language) {
            name += "." + language.toLowerCase();
        }

        if (isForced) {
            name += ".foreign";
        }

        return name;
    }

    function getNameWithoutExtension(path) {

        var parts = path.split('/');
        var name = parts[parts.length - 1];

        var index = name.lastIndexOf('.');

        if (index != -1) {
            name = name.substring(0, index);
        }

        return name;
    }

    function getParentDirectoryPath(path) {

        var parts = path.split('/');
        parts.length--;

        return parts.join('/');
    }

    function combinePaths(path1, path2) {

        return path1 + path2;
    }

    function getLocalId(serverId, itemId) {
        return serverId + '_' + itemId;
    }

    function hasImage(serverId, itemId, imageTag) {

        var deferred = DeferredBuilder.Deferred();
        getImageLocalPath(serverId, itemId, imageTag).done(function (localPath) {

            fileExists(localPath).done(function (exists) {

                deferred.resolveWith(null, [exists]);

            }).fail(getOnFail(deferred));

        }).fail(getOnFail(deferred));
        return deferred.promise();
    }

    function downloadImage(url, serverId, itemId, imageTag) {

        var deferred = DeferredBuilder.Deferred();
        getImageLocalPath(serverId, itemId, imageTag).done(function (localPath) {

            downloadFile(url, localPath).done(function () {

                deferred.resolve();

            }).fail(getOnFail(deferred));

        }).fail(getOnFail(deferred));
        return deferred.promise();
    }

    function getImageLocalPath(serverId, itemId, imageTag) {
        var deferred = DeferredBuilder.Deferred();

        var path = "images/" + serverId + "/" + itemId + "/" + imageTag;

        deferred.resolveWith(null, [path]);

        return deferred.promise();
    }

    function fileExists(path) {

        var deferred = DeferredBuilder.Deferred();

        if (window.NativeFileSystem) {
            var exists = NativeFileSystem.fileExists(path);
            Logger.log('fileExists: ' + exists + ' - path: ' + path);
            deferred.resolveWith(null, [exists]);
            return deferred.promise();
        }

        resolveFile(path, function (fileEntry) {
            Logger.log('fileExists: true - path: ' + path);
            deferred.resolveWith(null, [true]);

        }, function () {
            Logger.log('fileExists: false - path: ' + path);
            deferred.resolveWith(null, [false]);
        });

        return deferred.promise();
    }

    var fileSystem;
    function getFileSystem() {

        var deferred = DeferredBuilder.Deferred();

        if (fileSystem) {
            deferred.resolveWith(null, [fileSystem]);
        } else {
            requestFileSystem(PERSISTENT, 0, function (fs) {
                fileSystem = fs;
                deferred.resolveWith(null, [fileSystem]);
            });
        }

        return deferred.promise();
    }

    function getOnFail(deferred) {
        return function () {

            deferred.reject();
        };
    }

    function translateFilePath(path) {

        var deferred = DeferredBuilder.Deferred();

        if ($.browser.android) {
            deferred.resolveWith(null, ['file://' + path]);
            return deferred.promise();
        }

        resolveFile(path, function (fileEntry) {
            Logger.log('translateFilePath fileExists: true - path: ' + path);
            Logger.log('translateFilePath resolving with: ' + fileEntry.toURL());
            deferred.resolveWith(null, [fileEntry.toURL()]);

        }, function () {
            Logger.log('translateFilePath fileExists: false - path: ' + path);
            deferred.resolveWith(null, [path]);
        });

        return deferred.promise();
    }

    window.LocalAssetManager = {
        getLocalMediaSource: getLocalMediaSource,
        saveOfflineUser: saveOfflineUser,
        deleteOfflineUser: deleteOfflineUser,
        getCameraPhotos: getCameraPhotos,
        getOfflineActions: getOfflineActions,
        deleteOfflineActions: deleteOfflineActions,
        getServerItemIds: getServerItemIds,
        removeLocalItem: removeLocalItem,
        getLocalItem: getLocalItem,
        addOrUpdateLocalItem: addOrUpdateLocalItem,
        createLocalItem: createLocalItem,
        downloadFile: downloadFile,
        downloadSubtitles: downloadSubtitles,
        hasImage: hasImage,
        downloadImage: downloadImage,
        fileExists: fileExists,
        translateFilePath: translateFilePath
    };

})();