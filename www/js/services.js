angular.module('socialflashcards.services', [])
  .factory('FriendsService', ['$q', friendsService])

  function friendsService($q) {
    var _db;

    // We'll need this later.
    var _friends;

    return {
      initDB: initDB,

      // We'll add these later.
      getAllFriends: getAllFriends,
      addFriend: addFriend,
      updateFriend: updateFriend,
      deleteFriend: deleteFriend,
      getAllDocs: getAllDocs,
      loadDB: loadDB,
      getRandomFriends: getRandomFriends
    };

    function initDB() {
      // Creates the database or opens if it already exists
      var prefix = '';
      var database = 'friends2';

      var ua = navigator.userAgent;


      if (ua.indexOf("Android") >= 0) {

        var version = parseFloat(ua.slice(ua.indexOf("Android") + 8));

        if (version <= 4.3) {
          prefix = 'websql://';
        }
      }

      var dbname = prefix + database;


      _db = new PouchDB(dbname, {adapter: 'websql'});
      var reset = function() {
        _db.destroy().then(function() {
          console.log('ALL YOUR BASE ARE BELONG TO US');
          _db = new PouchDB(dbname);
          PouchDB.replicate(dbname, 'http://localhost:5984/friends', {live: true});

        });
      };
      reset();

    };

    function loadDB(){
      var prefix = '';
      var database = 'friends2';

      var ua = navigator.userAgent;

      //alert(ua);
      if (ua.indexOf("Android") >= 0) {

        var version = parseFloat(ua.slice(ua.indexOf("Android") + 8));

        if (version <= 4.3) {
          prefix = 'websql://';
        }
      }

      var dbname = prefix + database;
      //alert(dbname);
      _db = new PouchDB(dbname);

    };

    function getAllDocs(){
      //_db.destroy().then(function() { console.log('ALL YOUR BASE ARE BELONG TO US') });

      return _db.allDocs().then(function (results) {
        //console.log(JSON.stringify(results));
      });



    }

    function getRandomFriends(){
       return  _db.allDocs().then(function (res) {
         var friends = []
          var ids = res.rows.map(function (row) { return row.id; });
         for (var i = 0; i < 4; i++)  {
          var index = Math.floor(Math.random() * ids.length);
          friends.push(_db.get(ids[index]));
        }
          return  $q.all(friends);
        })

    };



    function addFriend(friend) {
      //return $q.when(_db.put(friend));
      return $q.when(_db.putIfNotExists(friend));
    };

    function updateFriend(friend) {
      return $q.when(_db.put(friend));
    };

    function deleteFriend(friend) {
      return $q.when(_db.remove(friend));
    };

    function getAllFriends() {
      if (!_friends) {
        return $q.when(_db.allDocs({ include_docs: true}))
          .then(function(docs) {

            // Each row has a .doc object and we just want to send an
            // array of birthday objects back to the calling controller,
            // so let's map the array to contain just the .doc objects.
            _friends = docs.rows.map(function(row) {
              // Dates are not automatically converted from a string.
              //row.doc.Date = new Date(row.doc.Date);
              return row.doc;
            });

            // Listen for changes on the database.
            _db.changes({ live: true, since: 'now', include_docs: true})
              .on('change', onDatabaseChange);

            return _friends;
          });
      } else {
        // Return cached data as a promise
        return $q.when(_friends);
      }
    };

    function onDatabaseChange(change) {
      var index = findIndex(_friends, change.id);
      var friend = _friends[index];

      if (change.deleted) {
        if (friend) {
          _friends.splice(index, 1); // delete
        }
      } else {
        if (friend && friend._id === change.id) {
          _friends[index] = change.doc; // update
        } else {
          _friends.splice(index, 0, change.doc) // insert
        }
      }
    }

  // Binary search, the array is by default sorted by _id.
    function findIndex(array, id) {
      var low = 0, high = array.length, mid;
      while (low < high) {
        mid = (low + high) >>> 1;
        array[mid]._id < id ? low = mid + 1 : high = mid
      }
      return low;
    }


  }//end
;
