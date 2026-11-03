'use strict';

const VERIFICATION_STATUSES = Object.freeze(['PENDING', 'VERIFIED', 'REJECTED']);
const NAME_LANGUAGES = Object.freeze(['ar', 'en']);
const NAME_TYPES = Object.freeze(['FORMER', 'HISTORICAL', 'ALTERNATIVE', 'TRANSLITERATION']);
const SORT_FIELDS = Object.freeze(['current_name_ar', 'current_name_en', 'population', 'created_at']);

module.exports = { VERIFICATION_STATUSES, NAME_LANGUAGES, NAME_TYPES, SORT_FIELDS };
