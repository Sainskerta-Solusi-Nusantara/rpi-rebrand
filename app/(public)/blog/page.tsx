import type { Metadata } from 'next'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import {
  BlogHero,
  BlogFeatured,
  BlogGrid,
  BlogTopics,
} from '@/components/organisms/blog-sections'

export const metadata: Metadata = {
  title: 'Blog & Insight',
  description:
    'Cerita, riset, dan panduan praktis dari dunia kerja Indonesia — untuk pencari kerja, perekrut, dan pemimpin SDM.',
}

export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogFeatured />
      <BlogGrid />
      <BlogTopics />
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}
