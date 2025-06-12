class Outfitter < Formula
  desc "Command-line tool for equipping your development journey with configurations and fieldguides"
  homepage "https://github.com/outfitter-dev/monorepo"
  url "https://registry.npmjs.org/outfitter/-/outfitter-0.1.0.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/outfitter", "--version"
  end
end