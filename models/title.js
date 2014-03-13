var Title = {

  init: function(db) {
    this.collection = db.collection('titles');
    this.collection.ensureIndex({date: 1}, function(err, indexName) {
      if (err) {
        console.error('Error setting index on titles collection.');
        console.error(err);
      }
    });
  },

  insert: function(item, callback) {
    this.collection.insert(item, function(err, result) {
      callback(err, result);
    });
  },

  latest: function(callback) {
    this.collection.find().sort({date: -1}).limit(1).toArray(function(err, items) {
      callback(err, items);
    });
  },

}

module.exports = Title;