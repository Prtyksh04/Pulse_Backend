import { z } from 'zod';

export const PulseAuthBody = z.object({
    email:z.string().email(),
    password:z.string().min(8)
});

export type PulseAuthBodyType = z.infer<typeof PulseAuthBody>;