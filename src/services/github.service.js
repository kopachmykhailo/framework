const getContributors = async (repo) => {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contributors?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
};

const searchRepositories = async () => {
  const response = await fetch(
    'https://api.github.com/search/repositories?q=stars:%3E100&per_page=50',
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  return data.items;
};

export const getSharedReposV1 = async (repo) => {
  const targetContributors = await getContributors(repo);

  const contributorLogins = new Set(targetContributors.map((c) => c.login));

  const repositories = await searchRepositories();

  const results = [];

  for (const repository of repositories) {
    if (repository.full_name === repo) {
      continue;
    }

    try {
      const contributors = await getContributors(repository.full_name);

      const shared = contributors.filter((c) =>
        contributorLogins.has(c.login),
      ).length;

      if (shared > 0) {
        results.push({
          repository: repository.full_name,
          sharedContributors: shared,
        });
      }
    } catch {
      // ignore repo
    }
  }

  return results
    .sort((a, b) => b.sharedContributors - a.sharedContributors)
    .slice(0, 5);
};

export const getSharedReposV2 = async (repo) => {
  const targetContributors = await getContributors(repo);

  const contributorLogins = new Set(targetContributors.map((c) => c.login));

  const repositories = await searchRepositories();

  const comparisons = await Promise.all(
    repositories.map(async (repository) => {
      try {
        const contributors = await getContributors(repository.full_name);

        const shared = contributors.filter((c) =>
          contributorLogins.has(c.login),
        ).length;

        return {
          repository: repository.full_name,
          sharedContributors: shared,
        };
      } catch {
        return null;
      }
    }),
  );

  return comparisons
    .filter(
      (item) => item && item.repository !== repo && item.sharedContributors > 0,
    )
    .sort((a, b) => b.sharedContributors - a.sharedContributors)
    .slice(0, 5);
};
