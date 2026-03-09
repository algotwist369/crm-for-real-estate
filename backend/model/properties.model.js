const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertiesSchema = new Schema({
    property_name: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Properties', propertiesSchema);