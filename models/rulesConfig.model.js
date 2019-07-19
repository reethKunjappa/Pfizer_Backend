var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/model");
var RuleConfigSchema = new Schema(
    [
        {
            createdBy: {},
            rulesSetup: {
                ruleName: String,
                ruleDescription: String
            },
            rulesApplication: {
                countryGroup: String,
                country: Array,
                global: {
                    type: Boolean,
                    default: false
                },
                sections: {},
                allSections: {
                    type: Boolean,
                    default: false
                }
            },
            action: {
                conflictType: String,
                comments: String,
                modifyLabelOnAccept: {
                    type: Boolean,
                    default: false
                },
                allowReject: {
                    type: Boolean,
                    default: false
                }
            },
            additionalInformation: {
                additionalInfo: {
                    type: Boolean,
                    default: false
                },
                addInfo:[]
            },
            exceptionData: [],
            documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]

        }
    ],
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("RuleConfigSchema", RuleConfigSchema);
