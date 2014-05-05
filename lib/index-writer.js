/**
 * fstream style directory writer to write to the git index.
 *
 * Uses `git hash-object` to write files to the object database
 * and `git update-index --add --cacheinfo` to add them to the index.
 */
