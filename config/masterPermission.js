export const ADMIN_PERMISSIONS = [
  "5baa08a7-9317-44b9-8ce2-ba5ab941f095", "3e7e57ee-f340-4b6c-a6b1-0a280790bc00", "ff64948e-29c4-40aa-994c-20b88a02fe20", "9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "f4b7b6a6-07e3-4257-b538-6fd87f234997", "77c2b4d4-a842-4bde-8057-ae80b0da62a0", "4d98e864-83a3-4f93-bf9e-1f8b93e1b400", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "ffe3add6-61af-4aa7-a4ee-701b03dc13b2", "77907469-5c96-4d04-b9de-64ede64ffdc6","4cbc1225-cd90-45c0-b5a0-d0d89e05f977", "25ad33b9-3b4f-454f-a3ec-b8cc1276c803", "3dfb37ea-ff42-4230-b9f7-dcedc7567369", "f92efebd-38c6-4070-ae84-965cece295fb", "5c0b5729-92bd-4078-9097-66a463a406e2", "55e7697b-2f75-4ff0-8cbe-b3f8736a7d26", "0459dfb0-0c0f-40ef-ae36-7ba6d7542f29", "db549f10-0b0f-4dc4-bfb9-e71b1de6f477", "ce89b133-487f-416f-9f1c-c1d29a300f52", "a3b6cd72-956a-4474-9e9d-22f24fa857ad","9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "99f16737-d8c1-4557-b17d-0f03516bd578", "a3b6cd72-956a-4474-9e9d-22f24fa857ad", "d2044cea-ff5d-4b97-a35a-07f88d13f45f","29806768-db39-485c-a839-6beb0a9b8aae", "9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "2eb74baf-e0d6-4ae1-bb12-0cd09713cd50", "e59d138a-83b7-407e-8f82-7ce07ca5632b", "f1fd0fd7-42b7-4408-b6a8-515835a29b32", "1b1da751-e378-4d3b-9a9c-91148e980a8a", "a5abd595-e7ad-41b5-83f6-f9fa9cb0753f", "d0ee78dd-1c2d-400f-8d6c-9239edd6db6a", "e7116083-1d40-4c85-b7fb-c3d357a59126","3e7e57ee-f340-4b6c-a6b1-0a280790bc00", "25ad33b9-3b4f-454f-a3ec-b8cc1276c803", "4d98e864-83a3-4f93-bf9e-1f8b93e1b400", "f92efebd-38c6-4070-ae84-965cece295fb"
];

export const ROLE_MASTER_CONFIG = {
  teacher: {
    name: "Teacher",
    roleType: "staff",
    hierarchyLevel: 5,
    permissions: [
      "5baa08a7-9317-44b9-8ce2-ba5ab941f095", "3e7e57ee-f340-4b6c-a6b1-0a280790bc00", "ff64948e-29c4-40aa-994c-20b88a02fe20", "9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "f4b7b6a6-07e3-4257-b538-6fd87f234997", "77c2b4d4-a842-4bde-8057-ae80b0da62a0", "4d98e864-83a3-4f93-bf9e-1f8b93e1b400", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "ffe3add6-61af-4aa7-a4ee-701b03dc13b2", "77907469-5c96-4d04-b9de-64ede64ffdc6"
    ]
  },
  accountant: {
    name: "Accountant",
    roleType: "staff",
    hierarchyLevel: 6,
    permissions: ["4cbc1225-cd90-45c0-b5a0-d0d89e05f977", "25ad33b9-3b4f-454f-a3ec-b8cc1276c803", "3dfb37ea-ff42-4230-b9f7-dcedc7567369", "f92efebd-38c6-4070-ae84-965cece295fb", "5c0b5729-92bd-4078-9097-66a463a406e2", "55e7697b-2f75-4ff0-8cbe-b3f8736a7d26", "0459dfb0-0c0f-40ef-ae36-7ba6d7542f29", "db549f10-0b0f-4dc4-bfb9-e71b1de6f477", "ce89b133-487f-416f-9f1c-c1d29a300f52", "a3b6cd72-956a-4474-9e9d-22f24fa857ad"]
  },
  librarian: {
    name: "Librarian",
    roleType: "staff",
    hierarchyLevel: 7,
    permissions: ["9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "99f16737-d8c1-4557-b17d-0f03516bd578", "a3b6cd72-956a-4474-9e9d-22f24fa857ad", "d2044cea-ff5d-4b97-a35a-07f88d13f45f"]
  },
  "admission-head": {
    name: "Admission Head",
    roleType: "staff",
    hierarchyLevel: 4,
    permissions: ["29806768-db39-485c-a839-6beb0a9b8aae", "9630b91a-5bcd-4c91-80e9-d8b0f61644d7", "e0638adc-67a7-4aee-817b-0e0ebb28a379", "f92efebd-38c6-4070-ae84-965cece295fb", "2eb74baf-e0d6-4ae1-bb12-0cd09713cd50", "e59d138a-83b7-407e-8f82-7ce07ca5632b", "f1fd0fd7-42b7-4408-b6a8-515835a29b32", "1b1da751-e378-4d3b-9a9c-91148e980a8a", "a5abd595-e7ad-41b5-83f6-f9fa9cb0753f", "d0ee78dd-1c2d-400f-8d6c-9239edd6db6a", "e7116083-1d40-4c85-b7fb-c3d357a59126"]
  },
  student: {
    name: "Student",
    roleType: "portal",
    hierarchyLevel: 10,
    permissions: ["3e7e57ee-f340-4b6c-a6b1-0a280790bc00", "25ad33b9-3b4f-454f-a3ec-b8cc1276c803", "4d98e864-83a3-4f93-bf9e-1f8b93e1b400", "f92efebd-38c6-4070-ae84-965cece295fb"]
  }
};