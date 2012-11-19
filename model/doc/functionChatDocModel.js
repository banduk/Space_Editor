

module.exports = Nohm.model('FuncChat', {
  idGenerator: 'increment',
  properties: {
    funct:{
      type: 'string',
      unique: false,
      index: true,
      validations: ['notEmpty']
    },
    user: {
      type: 'string',
      unique: false,
      validations: ['email', 'notEmpty']
    },
    message: {
      type: 'string',
      unique: false,
      validations: ['notEmpty']
    },
    date: {
      type: 'string',
      unique: true,
      validations: ['notEmpty']
    }
  },
  methods: {
    findByFunction: function(funcname, callback){
      var self = this;
      this.find({funct: funcname},function (err, ids) {
        if (err) {
         return next(err);
        }
        var chats = [];
        var count = 0;
        var len = ids.length;
        if (len === 0) callback(new Error('Cannot find chats for this function'));
        else{
          ids.forEach(function (id) {
            var chat = Nohm.factory('FuncChat');
            chat.load(id, function (err, props) {
              if (!err && chat.properties.funct.value === funcname) chats.push(chat.fullProps());
              if (++count === len) callback(null, chats);
            });
          });
        }
      });
    },
    create: function (data, callback) {
      console.log("CREATING CHAT: " + JSON.stringify(data));
      var self = this;
      this.p(data);
      this.save(function () {
        callback(self);
      });
    },
    fullProps: function(stringify){
      var properties = this.properties;

      var cleanData = {
          funct:    properties.funct.value,
          user:     properties.user.value,
          message:  properties.message.value,
          date:     properties.date.value
      }

      user.getByEmail(properties.user.value, function(usr){
        cleanData.userPic = usr.picture
      });
      return stringify ? JSON.stringify(cleanData) : cleanData;
    }
  }
});
