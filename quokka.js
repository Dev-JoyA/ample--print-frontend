export async function fetchRequest(request) {
  //const url = 'http://localhost:4001/contents/products';
  const url = 'https://ample-printhub-backend-latest.onrender.com/contents/products';

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer my-token',
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();
}

fetchRequest()
  .then(() => console.log('Fetch request completed'))
  .catch((error) => console.error('Error in fetch request:', error));
