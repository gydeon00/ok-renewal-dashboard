import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bztdjiyrbfbiooyjhofg.supabase.co'
const supabaseKey = 'sb_publishable_5fxZXvXCMwkxuvfTQueZoA_QB9J6-iv'

export const supabase = createClient(supabaseUrl, supabaseKey)