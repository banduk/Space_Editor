

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
    create: function (data, callback) {
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
