const xss = require('xss');
const validator = require('validator');
const { query } = require('./db');

/**
 * Býr til lista af verkefnum, hægt er að setja inn query string gildi
 * til að hafa áhrif á hvernig verkefni eru birt.
 * @param {*} req 
 * @param {*} res 
 */
async function list(req, res) {
  let result = '';
  const desc = req.query.order === 'desc';
  const skipun = desc ? 'position DESC' : 'position ASC';

  const { completed } = req.query;
  if (typeof completed !== 'undefined') {
    if (completed === 'true' || completed === 'false') {
      result = await query(`SELECT * FROM assignments WHERE completed = ${completed} ORDER BY ${skipun}`);
      return res.json(result.rows);
    }
  } else {
    result = await query(`SELECT * FROM assignments ORDER BY ${skipun}`);
    return res.json(result.rows);
  }

  return res.status(404).json({ error: 'Illegal query request' });
}

/**
 * Segir okkur hvort s sé breyta eða null 
 * @param {*} s - breyta af hvaða tagi sem er
 */
function isEmpty(s) {
  return s == null && !s;
}

/**
 * Validate athugar hvort breytur séu af réttu tagi og löglegar fyrir
 * gagnagrunn.
 * @param {string} title - Strengur með titli
 * @param {date} due - dateobject með dagsetningu eða null
 * @param {int} position - heiltala um staðsetningu í lista
 * @param {boolean} completed - boolean um hvort verkefni sé klárað
 */
function validate(title, due, position, completed) {
  const errors = [];

  if (!isEmpty(title)) {
    if (typeof title !== 'string' || title.length === 0 || title.length > 128) {
      errors.push({
        field: 'title',
        error: 'Title must be a non-empty string',
      });
    }
  }

  if (!isEmpty(due)) {
    if (typeof due !== 'string' || !validator.isISO8601(due)) {
      errors.push({
        field: 'due',
        error: 'Dagsetning verður að vera gild ISO 8601 dagsetning',
      });
    }
  }

  if (!isEmpty(position)) {
    if (typeof position !== 'number' || position < 0) {
      errors.push({
        field: 'position',
        error: 'Staðsetning verður að vera heiltala stærri eða jöfn 0',
      });
    }
  }

  if (!isEmpty(completed)) {
    if (typeof completed !== 'boolean') {
      errors.push({
        field: 'completed',
        error: 'Lokið verður að vera boolean gildi',
      });
    }
  }

  return errors;
}

/**
 * Post býr yil nýja færslu í gagnagrunn
 * @param {object} json - Hlutur sem á að búa til og setja í gagnagrunn
 */
async function post({ title, due, position } = {}) {
  const validationResult = validate(title, due, position);

  if (validationResult.length > 0) {
    return {
      success: false,
      validationResult,
      item: null,
    };
  }

  const xsstitle = xss(title);
  const xssdue = xss(due) === '' ? null : xss(due);
  const xssposition = xss(position) === '' ? null : xss(position);

  const skipun = ('INSERT INTO assignments (title, due, position) VALUES ($1, $2, $3)');
  const values = [xsstitle, xssdue, xssposition];
  const result = await query(skipun, values);

  return {
    sucess: true,
    validationResult: [],
    item: result.rows[0],
  };
}

/**
 * Breytir Json object útfrá gefnum gildum
 * @param {int} id - Auðkenni
 * @param {obejct} json - Hlutur sem inniheldur breytur
 */
async function patch(id, { title, due, position, completed }) {
  const validationResult = validate(title, due, position, completed);

  if (validationResult.length > 0) {
    return {
      success: false,
      validationResult,
      item: null,
    };
  }

  const xsstitle = xss(title);
  const xssdue = xss(due) === '' ? null : xss(due);
  const xssposition = xss(position) === '' ? null : xss(position);

  const skipun = ('UPDATE assignments SET title = $1,  due = $2, position = $3, completed = $4 WHERE id = $5');
  const values = [xsstitle, xssdue, xssposition, completed, id];

  const result = await query(skipun, values);

  return {
    sucess: true,
    validationResult: [],
    item: result.rows[0],
  };
}

/**
 * Sækir færslu í gagnagrunn útfrá gefnu auðkenni.
 * @param {int} id - auðkenni
 */
async function getId(id) {
  const skipun = 'SELECT * FROM assignments WHERE id = $1';

  const result = await query(skipun, [id]);

  return result.rows;
}

/**
 * Eyðir færslu í gagnagrunn útfŕa gefnu auðkenni
 * @param {int} id - auðkenni
 */
async function deleteId(id) {
  const skipun = 'DELETE FROM assignments WHERE id = $1';

  const result = await query(skipun, [id]);

  return result.rowCount === 1;
}

module.exports = {
  list,
  patch,
  getId,
  deleteId,
  post,
};
