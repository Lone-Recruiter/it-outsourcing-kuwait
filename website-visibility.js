(() => {
    const SUPABASE_URL = "https://dsvjuvryxbjtbsaqjpoi.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_X9OswwduDbUNw6CFa4U1qw_e_UhqpAa";

    async function loadVisibility() {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/recruitment_website_visibility?select=position_id,is_visible`,
            {
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
                },
                cache: "no-store"
            }
        );
        if (!response.ok) throw new Error("Website visibility could not be verified.");

        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error("Website visibility returned an invalid response.");
        return new Map(rows.map(row => [row.position_id, row.is_visible === true]));
    }

    function isVisible(position, overrides) {
        return overrides.has(position.id)
            ? overrides.get(position.id) === true
            : position.active === true;
    }

    window.KBMRecruitmentWebsite = { loadVisibility, isVisible };
})();

