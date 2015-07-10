angular.module('app', [])
  .controller('mainCtrl', ['$scope', '$http', function($scope, $http){
    $http.get('output/tweets.json').success(function(tweets){
      $scope.tweets = tweets.map(function(d){
        var linkStart = d.text.lastIndexOf('https:');
        d.text = linkStart >= 0 ? d.text.substring(0, linkStart) : d.text;
        return d;
      });
    });

  }]);