'use strict';

/**
 * @ngdoc function
 * @name cnodejs.services:UserService
 * @description
 * # UserService
 * User Service of the cnodejs app
 */

angular.module('cnodejs.services')
.factory('User', function(ENV, $resource, $log, $q, Storage) {
  var storageKey = 'user';
  var resource = $resource(ENV.api + '/accesstoken');
  var userResource = $resource(ENV.api + '/user/:loginname', {
    loginname: ''
  });
  var user = Storage.get(storageKey) || {};
  return {
    login: function(accesstoken) {
      var $this = this;
      return resource.save({
        accesstoken: accesstoken
      }, null, function(response) {
        $log.debug('post accesstoken:', response);
        user.accesstoken = accesstoken;
        $this.getByLoginName(response.loginname).$promise.then(function(r) {
          user = r.data;
          user.id = response.id;
          user.accesstoken = accesstoken;
          Storage.set(storageKey, user);
        });
        user.loginname = response.loginname;
      });
    },
    logout: function() {
      user = {};
      Storage.remove(storageKey);
    },
    getCurrentUser: function() {
      $log.debug('current user:', user);
      return user;
    },
    getByLoginName: function(loginName) {
      if (user && loginName === user.loginname) {
        var userDefer = $q.defer();
        $log.debug('get user info from storage:', user);
        userDefer.resolve({
          data: user
        });
        return {
          $promise: userDefer.promise
        };
      }
      return this.get(loginName);
    },
    get: function(loginName) {
      return userResource.get({
        loginname: loginName
      }, function(response) {
        $log.debug('get user info:', response);
        if (user && user.loginname === loginName) {
          var accesstoken = user.accesstoken;
          var id = user.id;
          user = response.data;
          user.accesstoken = accesstoken;
          user.id = id;
          Storage.set(storageKey, user);
        }
      });
    }
  };
});
