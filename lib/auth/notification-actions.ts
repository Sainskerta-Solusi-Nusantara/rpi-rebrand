'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult = { ok: true } | { ok: false; error: string }

const updateSchema = z.object({
  emailLoginAlert: z.boolean(),
  emailSecurityEvent: z.boolean(),
  emailInvitation: z.boolean(),
  emailMarketing: z.boolean(),
})

function readCheckbox(formData: FormData, key: string): boolean {
  // Standard HTML form: checkbox submits its value only when checked; we use
  // value="on" and treat any present value as true.
  return formData.has(key)
}

/**
 * Persist notification preferences for the signed-in user. Upserts the row.
 */
export async function updateNotificationPrefs(formData: FormData): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: t.srvAuth2.notification.mustLogin }

  const parsed = updateSchema.safeParse({
    emailLoginAlert: readCheckbox(formData, 'emailLoginAlert'),
    emailSecurityEvent: readCheckbox(formData, 'emailSecurityEvent'),
    emailInvitation: readCheckbox(formData, 'emailInvitation'),
    emailMarketing: readCheckbox(formData, 'emailMarketing'),
  })
  if (!parsed.success) return { ok: false, error: t.srvAuth2.notification.dataInvalid }
  const data = parsed.data

  try {
    await prisma.notificationPref.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    })
    revalidatePath('/dashboard/notifikasi')
    return { ok: true }
  } catch (err) {
    console.error('[updateNotificationPrefs] failed', err)
    return { ok: false, error: t.srvAuth2.notification.genericError }
  }
}
