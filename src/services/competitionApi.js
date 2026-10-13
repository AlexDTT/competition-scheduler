import {validateState} from '../../shared/validation.js';

export class ApiError extends Error {
  constructor(message, status) {super(message); this.status = status;}
}
async function request(options = {}) {
  let response;
  try {response = await fetch('/api/competition', options);}
  catch {throw new ApiError('Cannot reach the server. Start the backend and try again.', 0);}
  let record;
  try {record = await response.json();}
  catch {throw new ApiError('The server returned an invalid response. Check that the API is running.', response.status);}
  if (!response.ok) throw new ApiError(record.error || 'The competition could not be saved.', response.status);
  if (!Number.isSafeInteger(record.revision) || record.revision < 0 || record.schemaVersion !== 1) throw new ApiError('The server returned an invalid competition record.', 500);
  return {...record, state: validateState(record.state)};
}
export const loadCompetition = () => request();
export const saveCompetition = (state, revision) => request({
  method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({state, revision}),
});
export function readLegacyCompetition() {
  try {return validateState(JSON.parse(localStorage.getItem('roundhouse-v1')));}
  catch {return null;}
}
