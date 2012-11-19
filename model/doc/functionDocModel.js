



module.exports = Nohm.model('Function', {
  idGenerator: 'increment',
  properties: {
    name: {
      type: 'string',
      unique: true,
      validations: [
        'notEmpty'
      ]
    },
    description: {
      type: 'string',
      unique: false,
      validations: [
        'notEmpty'
      ]
    },
    // parent:{
    //   type: 'Function',
    //   validations: []
    // },
    params: {
      type: 'json',
      unique: false,
      validations: []
    },
    chats:{
      type: 'json',
      unique: false,
      validations: []
    },

  },
  methods: {
    findByName: function(name, callback){
      var self = this;
      this.find({name: name}, function (err, ids) {
        if (ids.length === 0) callback(new Error('No functions with this name in the docs'));
        else{
          self.load(ids[0], function (err) {
            if (err) callback(new Error('Error while loading function data'));
            else{
              callback(null, this);
            }
          });
        }
      });
    },
    create: function (data, callback) {
      var self = this;
      this.p(data);
      this.save(function () {
        callback.apply(self.cleanData());
      });
    },
    addChat: function(chat, callback){
      var self = this;
      this.findByName(chat.funct, function(fDoc){

        var funcChat = Nohm.factory('FuncChat');
        funcChat.create(chat, function(fChat){

          if(!fChat) callback(false);
          else{
            // var newFdoc = fDoc.cleanData();
            // var chats = JSON.parse(newFdoc.chats);

            // var chatToAdd = fChat.cleanData;
            // chats[chatToAdd.date] = chatToAdd;

            // newFdoc.chats = chats;
            // newFdoc.save;

            callback(fChat.cleanData);
          }
        });
        // console.log(JSON.stringify(fDoc));
        // func.create(data, callback);

        // fDoc.

        // fDoc.properties.chats.value[chat.date] = chat;
        // console.log(fDoc);
        // fDoc.save(callback(fDoc));
      });
    },
    cleanData: function(stringify){
      var properties = this.properties;

      var cleanData = {
        name:         properties.name.value,
        description:  properties.description.value,
        params:       properties.params.value,
        chats:        properties.chats.value
      }

      return stringify ? JSON.stringify(cleanData) : cleanData;
    }
  }
});
