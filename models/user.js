var User = {

  init: function(db) {
    this.collection = db.collection('users');
    this.collection.ensureIndex({id: 1}, function(err, indexName) {
      if (err) {
        console.error('Error setting index on users');
        console.error(err);
      }
    });
  },

  find: function(id, callback) {
    this.collection.findOne({'id': id}, function(err, item) {
      callback(err, item);
    });
  },

  insert: function(item, callback) {
    this.collection.insert(item, function(err, result) {
      callback(err, result);
    });
  },

  count: function(callback) {
    this.collection.count(function(err, count) {
      callback(err, count);
    });
  },

  isWhitelisted: function(id, callback) {
    this.collection.findOne({'id': id}, function(err, item) {
      if (item !== null) {
        callback(err, item.whitelisted);
      } else {
        callback(err, false);
      }
    });
  },

  whitelist: function(id, author, callback) {
    this.collection.update({'id': id}, {$set: {whitelisted: true, whitelistedBy: author}}, function(err, result) {
      callback(err, result);
    });
  },

}

module.exports = User;