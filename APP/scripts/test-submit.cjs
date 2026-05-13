const superjson = require('superjson');

async function main() {
  const input = {
    token: 'c80bfc64d573913f9a2f4b1ae08f686ad9586d8eebf76464',
    data: {
      guests: [
        {
          fullName: 'Jane Doe',
          country: 'Portugal',
          citizenId: '123456',
          dob: new Date('1990-01-01'),
        },
        {
          fullName: 'John Doe',
          country: 'Portugal',
          citizenId: '654321',
          dob: new Date('1985-05-15'),
        },
      ],
    },
  };

  const body = superjson.serialize(input);

  const res = await fetch('http://localhost:3000/api/trpc/checkin.submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ json: body.json, meta: body.meta }),
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
