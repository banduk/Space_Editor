module.exports = Nohm.model('Project', {
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
      validations: [
        'notEmpty'
      ]
    },
    functions: {
      type: 'json',
      validations: []
    },
    chats:{
      type: 'json',
      validations: []
    }
  },
  methods: {}
});
