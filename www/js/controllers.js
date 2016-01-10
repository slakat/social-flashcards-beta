angular.module('socialflashcards.controllers', [])

    .controller('AppCtrl', function ($scope, $state, OpenFB) {

        $scope.logout = function () {
            OpenFB.logout();
            $state.go('app.login');
        };

        $scope.revokePermissions = function () {
            OpenFB.revokePermissions().then(
                function () {
                    $state.go('app.login');
                },
                function () {
                    alert('OpenFB : Revoke Permissions Failed!');
                });
        };
    })

    .controller('LoginCtrl', function ($scope, $location, OpenFB) {

        $scope.facebookLogin = function () {

            OpenFB.login('email,public_profile,user_friends,user_photos,user_posts,publish_actions,user_birthday').then(
                function () {
                    $location.path('/app/person/me/feed');
                },
                function () {
                    alert('OpenFB : Login Failed! Please Try Again...');
                });
        };
    })

    .controller('ShareCtrl', function ($scope, OpenFB) {

        $scope.item = {};

        $scope.share = function () {
            OpenFB.post('/me/feed', $scope.item)
                .success(function () {
                    $scope.status = "OpenFB : Item Shared Successfully!";
                })
                .error(function(data) {
                    alert(data.error.message);
                });
        };
    })

    .controller('ProfileCtrl', function ($scope, OpenFB) {
        OpenFB.get('/me?fields=id,name,email,birthday').success(function (user) {
            $scope.user = user;
        });
    })

    .controller('PersonCtrl', function ($scope, $stateParams, OpenFB) {
        OpenFB.get('/' + $stateParams.personId + '?fields=id,name,email,birthday').success(function (user) {
            $scope.user = user;
        });
    })

    .controller('FriendsCtrl', function ($scope, $stateParams, OpenFB, $ionicPlatform, FriendsService, $q, $ionicModal) {
  /*      OpenFB.get('/' + $stateParams.personId + '/friends', {limit: 5})
            .success(function (result) {
                $scope.friends = result.data;
            })
            .error(function(data) {
                alert(data.error.message);
            });*/
      // Initialize the database.

      $ionicPlatform.ready(function() {

        FriendsService.loadDB();

         FriendsService.getRandomFriends().then(function(result)
        {
          var id = Math.floor(Math.random() * 4);
          $scope.selected = result[id];
          $q.when($scope.friends = result);


        });

      });






    })

    .controller('AllFriendsCtrl', function ($scope, $stateParams, OpenFB, $ionicPlatform, FriendsService, $q) {


      // Initialize the database.
      $ionicPlatform.ready(function() {

          FriendsService.initDB();
        //FriendsService.destroyDB();
        // Get all birthday records from the database.
        //FriendsService.getAllFriends().then(function(friends) {
        //});
      });

      var promises = [];


      OpenFB.get('/' + $stateParams.personId + '/taggable_friends?fields=id,name,picture.width(200).height(200)', {limit: 2000,})
            .success(function (result) {
                $scope.friends = result.data;

              for(var id in result.data) {
                var friend = result.data[id];
                promises.push(FriendsService.addFriend({
                  "name": friend.name,
                  "picture": friend.picture.data.url
                }))
              }

              $q.all(promises);
            })
            .error(function(data) {
                alert(data.error.message);
            });

    })

    .controller('MutualFriendsCtrl', function ($scope, $stateParams, OpenFB) {
        OpenFB.get('/' + $stateParams.personId + '?fields=context.fields%28mutual_friends%29', {limit: 50})
            .success(function (result) {
                OpenFB.get('/' + result.context.id, {limit: 50})
                    .success(function (result) {
                      $scope.friends = result.mutual_friends.data;
                    })
                    .error(function(data) {
                        alert(data.error.message);
                    });
            })
            .error(function(data) {
                alert(data.error.message);
            });
    })

    .controller('FeedCtrl', function ($scope, $stateParams, OpenFB, $ionicLoading) {

        $scope.show = function() {
            $scope.loading = $ionicLoading.show({
                content: 'Loading User Feed(s)...'
            });
        };
        $scope.hide = function(){
            $scope.loading.hide();
        };

        function loadFeed() {
            $scope.show();
            OpenFB.get('/me/feed', {limit: 30})
                .success(function (result) {
                    $scope.hide();
                    $scope.items = result.data;
                    // Used with pull-to-refresh
                    $scope.$broadcast('scroll.refreshComplete');
                })
                .error(function(data) {
                    $scope.hide();
                    alert(data.error.message);
                });
        }

        $scope.doRefresh = loadFeed;

        loadFeed();

    })

