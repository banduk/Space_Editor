
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
    params: {
      type: 'json',
      unique: false,
      validations: []
    }
  },
  methods: {
    findByName: function(name, callback){
      var self = this;
      this.find({name: name}, function (err, ids) {
        if (ids.length === 0) callback(new Error('No functions with this name in the docs'));
        else{
          self.load(ids[0], function (err) {
            if (err) callback(err);
            else{
              callback(null, this);
            }
          });
        }
      });
    },
    create: function (data, callback) {
      var self = this;
      self.p(data);
      self.save(function (err) {
        if(err) callback(err);
        else callback(null, self);
      });
    },
    addChat: function(chat, callback){
      var self = this;
      this.findByName(chat.funct, function(err, fDoc){
        if(err) callback(err);
        else{
          var funcChat = Nohm.factory('FuncChat');
          funcChat.create(chat, function(fChat){
            if(!fChat) callback(new Error('Error while creating chat'));
            else{
              fDoc.link(fChat, {
                name: 'hasChat',
                error: function (error_mesage, validation_errors, object) {
                  callback(new Error(error_message));
                }
              });
              fDoc.save(function (err, is_link_error, link_error_model_name) {
                if ( ! err) {
                  callback(null, fChat.fullProps());
                } else {
                  callback(err);
                }
              });

            }
          });
        }
      });
    },
    cleanData: function(stringify){
      var properties = this.properties;

      var cleanData = {
        name:         properties.name.value,
        description:  properties.description.value,
        params:       properties.params.value
      }

      return stringify ? JSON.stringify(cleanData) : cleanData;
    }
  }
});
