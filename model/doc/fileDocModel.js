module.exports = Nohm.model('File', {
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
    files: {
      type: 'json',
      validations: []
    },
    members: {
      type: 'json',
      validations: []
    }
  },
  methods: {}
});
