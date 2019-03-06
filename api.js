const express = require('express');

const {
  list,
  post,
  patch,
  getId,
  deleteId,
} = require('./todos');

async function listRoute(req, res) {
  const items = await list();

  return res.json(items);
}

async function makeAssignment(req, res) {
  const { title, due, position } = req.body;

  const result = await post({ title, due, position });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!result.success && result.validationResult.length > 0) {
    return res.status(400).json(result.validationResult);
  }

  return res.status(201).json(result.item);
}

async function getAssignment(req, res) {
  const { id } = req.params;
  const result = await getId(id);

  if (result) {
    return res.json(result);
  }

  return res.status(404).json({ error: 'Item not found' });
}

async function updateAssignment(req, res) {
  const { id } = req.params;
  const { title, position, completed, due } = req.body;

  const result = await patch(id, { title, due, position, completed });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!result.success && result.validationResult.length > 0) {
    return res.status(400).json(result.validationResult);
  }

  return res.status(201).json(result.item);
}

async function deleteAssignment(req, res) {
  const { id } = req.params;

  const items = await deleteId(id);

  if (items) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Item not found' });
}

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

router.get('/', catchErrors(listRoute));
router.post('/', catchErrors(makeAssignment));
router.get('/:id', catchErrors(getAssignment));
router.patch('/:id', catchErrors(updateAssignment));
router.delete('/:id', catchErrors(deleteAssignment));

module.exports = router;
