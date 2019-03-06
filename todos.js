const xss = require('xss');
const validator = require('validator');
const { query } = require('./db');

async function list() {
  const result = await query('SELECT * FROM assignments');

  return result.rows;
}

function isEmpty(s) {
  return s == null && !s;
}

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

async function getId(id) {
  const skipun = 'SELECT * FROM assignments WHERE id = $1';

  const result = await query(skipun, [id]);

  return result.rows;
}

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
